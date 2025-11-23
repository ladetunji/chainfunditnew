import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { userKycVerifications, users } from '@/lib/schema';
import { createPersonaInquiry } from './persona-client';
import { KycGateResult } from './types';

const KYC_REFRESH_DAYS = 365;

function isFreshKyc(date?: Date | null) {
  if (!date) return false;
  const diff = Date.now() - new Date(date).getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  return days <= KYC_REFRESH_DAYS;
}

async function getLatestVerification(userId: string) {
  return db.query.userKycVerifications.findFirst({
    where: eq(userKycVerifications.userId, userId),
    orderBy: desc(userKycVerifications.createdAt),
  });
}

export async function ensurePayoutKyc(user: {
  id: string;
  fullName: string;
  email: string;
  kycStatus?: string | null;
  kycLastCheckedAt?: Date | null;
}) : Promise<KycGateResult> {
  if (
    user.kycStatus === 'approved' &&
    isFreshKyc(user.kycLastCheckedAt)
  ) {
    return { status: 'cleared' };
  }

  const latest = await getLatestVerification(user.id);
  if (
    latest &&
    ['pending', 'processing', 'in_review'].includes(latest.status)
  ) {
    return {
      status: 'pending',
      verificationId: latest.id,
      provider: latest.provider,
      inquiryId: latest.externalInquiryId ?? null,
      sessionToken: latest.sessionToken ?? null,
      message: 'KYC verification already in progress',
    };
  }

  const referenceId = `payout-${user.id}-${Date.now()}`;
  const [verification] = await db
    .insert(userKycVerifications)
    .values({
      userId: user.id,
      provider: 'persona',
      status: 'pending',
      referenceId,
    })
    .returning();

  let inquiryId: string | null = null;
  let sessionToken: string | null = null;

  try {
    const personaInquiry = await createPersonaInquiry({
      referenceId,
      fullName: user.fullName,
      email: user.email,
      metadata: { note: 'Campaign payout verification' },
    });

    inquiryId = personaInquiry.inquiryId;
    sessionToken = personaInquiry.sessionToken;

    await db
      .update(userKycVerifications)
      .set({
        externalInquiryId: personaInquiry.inquiryId,
        sessionToken: personaInquiry.sessionToken,
        payload: personaInquiry.raw,
        updatedAt: new Date(),
      })
      .where(eq(userKycVerifications.id, verification.id));
  } catch (error) {
    console.error('[kyc] Failed to create Persona inquiry', error);
  }

  await db
    .update(users)
    .set({
      kycStatus: 'pending',
      kycProvider: 'persona',
      kycReference: referenceId,
      kycLastCheckedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return {
    status: 'pending',
    verificationId: verification.id,
    provider: 'persona',
    inquiryId,
    sessionToken,
    message: 'KYC verification required before requesting payout',
  };
}

export async function handlePersonaWebhook(payload: any) {
  const inquiryId = payload?.data?.id;
  const status = payload?.data?.attributes?.status;
  if (!inquiryId || !status) {
    throw new Error('Invalid Persona webhook payload');
  }

  const verification = await db.query.userKycVerifications.findFirst({
    where: eq(userKycVerifications.externalInquiryId, inquiryId),
  });

  if (!verification) {
    throw new Error(`No verification found for inquiry ${inquiryId}`);
  }

  let normalizedStatus: 'approved' | 'rejected' | 'in_review' | 'failed';
  switch (status) {
    case 'passed':
    case 'completed':
      normalizedStatus = 'approved';
      break;
    case 'needs_review':
      normalizedStatus = 'in_review';
      break;
    case 'failed':
    case 'declined':
      normalizedStatus = 'rejected';
      break;
    default:
      normalizedStatus = 'failed';
  }

  await db
    .update(userKycVerifications)
    .set({
      status: normalizedStatus,
      payload: payload,
      updatedAt: new Date(),
      completedAt: normalizedStatus === 'approved' ? new Date() : null,
      failureReason:
        normalizedStatus === 'rejected'
          ? payload?.data?.attributes?.decision_reason || null
          : null,
    })
    .where(eq(userKycVerifications.id, verification.id));

  if (normalizedStatus === 'approved') {
    await db
      .update(users)
      .set({
        kycStatus: 'approved',
        kycProvider: 'persona',
        kycExternalId: inquiryId,
        kycRiskScore: payload?.data?.attributes?.risk_score
          ? String(payload.data.attributes.risk_score)
          : null,
        kycPayload: payload,
        kycLastCheckedAt: new Date(),
      })
      .where(eq(users.id, verification.userId));
  } else if (normalizedStatus === 'rejected') {
    await db
      .update(users)
      .set({
        kycStatus: 'rejected',
        kycProvider: 'persona',
        kycExternalId: inquiryId,
        kycPayload: payload,
        kycLastCheckedAt: new Date(),
      })
      .where(eq(users.id, verification.userId));
  }

  return normalizedStatus;
}

