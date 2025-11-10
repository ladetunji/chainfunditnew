import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { notifications } from '@/lib/schema/notifications';
import { eq } from 'drizzle-orm';
import { requireAdminAuthWith2FA } from '@/lib/admin-auth';
import { sendAccountChangeApprovalEmail, sendAccountChangeRejectionEmail } from '@/lib/notifications/account-change-alerts';

/**
 * PATCH /api/admin/account-requests/[id]
 * Approve or reject an account change request
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication with 2FA
    const adminUser = await requireAdminAuthWith2FA(request);
    
    const { id: userId } = await params;
    const body = await request.json();
    const { action, notes, newAccountNumber, newBankCode, newBankName, newAccountName } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get user with account change request
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.accountChangeRequested) {
      return NextResponse.json(
        { error: 'User does not have a pending account change request' },
        { status: 400 }
      );
    }

    let updatedUser;

    if (action === 'approve') {
      // For approval, we unlock the account so user can update their details
      // If new account details are provided, update them
      const updateData: any = {
        accountLocked: false,
        accountChangeRequested: false,
        accountChangeReason: null,
        updatedAt: new Date(),
      };

      // If new account details are provided, update them
      if (newAccountNumber && newBankCode) {
        updateData.accountNumber = newAccountNumber;
        updateData.bankCode = newBankCode;
        updateData.bankName = newBankName || null;
        updateData.accountName = newAccountName || null;
        // Reset verification since account details changed
        updateData.accountVerified = false;
        updateData.accountVerificationDate = null;
      }

      updatedUser = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      // Send approval email and create in-app notification
      try {
        await Promise.all([
          sendAccountChangeApprovalEmail({
            userId: user.id,
            userName: user.fullName,
            userEmail: user.email,
            adminName: adminUser.fullName,
            notes: notes || undefined,
          }),
          // Create in-app notification for user
          db.insert(notifications).values({
            userId: user.id,
            type: 'account_change_approved',
            title: 'Account Change Request Approved',
            message: `Your request to change your bank account details has been approved. ${newAccountNumber && newBankCode ? 'Your account details have been updated.' : 'Your account is now unlocked. You can update your bank account details in your payment settings.'}`,
            isRead: false,
            metadata: JSON.stringify({
              action: 'approve',
              accountUnlocked: true,
              accountDetailsUpdated: !!(newAccountNumber && newBankCode),
              adminName: adminUser.fullName,
              notes: notes || null,
            }),
          }),
        ]);
      } catch (emailError) {
        console.error('Failed to send approval email or create notification:', emailError);
        // Don't fail the approval for email/notification errors
      }

    } else if (action === 'reject') {
      // For rejection, we keep the account locked but clear the request
      if (!notes || notes.trim().length < 10) {
        return NextResponse.json(
          { error: 'Rejection reason is required (minimum 10 characters)' },
          { status: 400 }
        );
      }

      updatedUser = await db
        .update(users)
        .set({
          accountChangeRequested: false,
          accountChangeReason: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      // Send rejection email and create in-app notification
      try {
        await Promise.all([
          sendAccountChangeRejectionEmail({
            userId: user.id,
            userName: user.fullName,
            userEmail: user.email,
            adminName: adminUser.fullName,
            reason: notes.trim(),
          }),
          // Create in-app notification for user
          db.insert(notifications).values({
            userId: user.id,
            type: 'account_change_rejected',
            title: 'Account Change Request Not Approved',
            message: `Your request to change your bank account details could not be approved. Reason: ${notes.trim()}`,
            isRead: false,
            metadata: JSON.stringify({
              action: 'reject',
              reason: notes.trim(),
              adminName: adminUser.fullName,
            }),
          }),
        ]);
      } catch (emailError) {
        console.error('Failed to send rejection email or create notification:', emailError);
        // Don't fail the rejection for email/notification errors
      }
    }

    return NextResponse.json({
      success: true,
      message: `Account change request ${action}d successfully`,
      user: updatedUser?.[0],
    });

  } catch (error) {
    console.error('Error processing account change request:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message === '2FA verification required') {
        return NextResponse.json(
          { error: '2FA verification required' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to process account change request' },
      { status: 500 }
    );
  }
}

