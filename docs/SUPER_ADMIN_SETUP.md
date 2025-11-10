# Super Admin Setup Guide

This document explains how to set up and use the super admin functionality in ChainFundIt.

## Overview

The super admin flow provides elevated privileges for managing user roles and permissions across the platform. Super admins have access to:

- User role management (promote/demote users to admin or super admin)
- Full access to all admin features
- Super admin panel at `/admin/super-admin`

## Setting Up a Super Admin

### Method 1: Using the Script (Recommended)

Use the provided script to set a user as super admin:

```bash
npx tsx scripts/set-super-admin.ts <email>
```

**Example:**
```bash
npx tsx scripts/set-super-admin.ts tolu@chainfundit.org
```

**Note:** Make sure you have your `DATABASE_URL` environment variable set before running the script.

### Method 2: Direct Database Update

You can also update the user directly in the database:

```sql
UPDATE users 
SET 
  role = 'super_admin',
  is_verified = true,
  has_completed_profile = true
WHERE email = 'tolu@chainfundit.org';
```

## Accessing the Super Admin Panel

1. Log in with a super admin account at `/signin`
2. Navigate to `/admin` (you'll be redirected to `/admin/overview`)
3. Click on "Super Admin" in the sidebar navigation (only visible to super admins)
4. Or directly navigate to `/admin/super-admin`

## Super Admin Features

### User Role Management

The super admin panel allows you to:

- **View all users** with their current roles
- **Search and filter** users by role (user, admin, super_admin)
- **Change user roles** by clicking "Change Role" on any user
- **View statistics** about user distribution by role

### Role Hierarchy

- **user**: Regular platform user (default)
- **admin**: Can access admin dashboard and manage platform content
- **super_admin**: Full access including user role management

## API Endpoints

### Update User Role

**Endpoint:** `PATCH /api/admin/super-admin/users/[id]/role`

**Authentication:** Requires super admin privileges

**Request Body:**
```json
{
  "role": "admin" | "super_admin" | "user"
}
```

**Response:**
```json
{
  "message": "User role updated successfully",
  "user": {
    "id": "...",
    "email": "...",
    "fullName": "...",
    "role": "admin"
  }
}
```

## Security Notes

1. **Super admin access is restricted** - Only users with `role = 'super_admin'` can:
   - Access the super admin panel
   - See the "Super Admin" navigation item
   - Use super admin API endpoints

2. **Role changes are logged** - All role changes update the `updatedAt` timestamp

3. **Authentication required** - All super admin routes require:
   - Valid authentication token
   - Super admin role verification
   - Account must be verified and not locked

## Current Super Admin

The following email has been configured as a super admin:

- **tolu@chainfundit.org**

## Troubleshooting

### User not found error
- Ensure the user exists in the database
- Check that the email address is correct
- The user must have completed the signup process

### Access denied errors
- Verify the user has `role = 'super_admin'` in the database
- Check that `is_verified = true`
- Ensure `account_locked = false`

### Script fails with DATABASE_URL error
- Set your `DATABASE_URL` environment variable
- Or use a `.env` file in the project root
- Make sure the database connection is working

## Next Steps

After setting up the super admin:

1. Log in with the super admin account
2. Navigate to `/admin/super-admin`
3. Review and manage user roles as needed
4. Promote other users to admin or super admin as required

