# Banner Management - Admin Authentication

## Overview

The banner management system is now protected with admin authentication. Only users with admin role can create, edit, delete banners and view analytics.

---

## What's Protected

### Admin-Only Endpoints
- `POST /api/banners` - Create banner
- `PUT /api/banners/:id` - Update banner
- `DELETE /api/banners/:id` - Delete banner
- `GET /api/banners/:id` - Get single banner
- `GET /api/banners/list` - List all banners
- `GET /api/banners/:id/statistics` - View analytics
- `POST /api/banners/check-conflicts` - Check schedule conflicts

### Public Endpoints (No Auth Required)
- `GET /api/banners/serve` - Get banner for display
- `POST /api/banners/impression` - Track impression
- `POST /api/banners/click` - Track click

---

## How to Make a User an Admin

### Method 1: Direct Database Update (Recommended for First Admin)

Using MongoDB shell or MongoDB Compass:

```javascript
// Find the user by phone number
db.users.findOne({ phone: "9123456789" })

// Update to add admin role
db.users.updateOne(
  { phone: "9123456789" },
  { $set: { "roles.admin": true } }
)

// Verify the update
db.users.findOne({ phone: "9123456789" }, { roles: 1 })
```

### Method 2: Via API (If You Have Admin Creation Endpoint)

If you create an admin creation endpoint in the future:

```javascript
PUT /api/user/:id/role
{
  "role": "admin",
  "value": true
}
```

---

## User Model Structure

The User model supports the following role structure:

```javascript
{
  _id: "...",
  firstName: "John",
  phone: "9123456789",
  roles: {
    admin: true  // Makes user an admin
  }
}
```

**Alternative role structures also supported:**
```javascript
// Array format
roles: ["admin"]

// Direct field
isAdmin: true
```

---

## Admin Middleware

The system uses `requireAdmin` middleware that checks:

1. **Is user authenticated?** - Checks if `req.user` exists
2. **Does user have admin role?** - Checks if:
   - `req.user.roles.admin === true`, OR
   - `req.user.roles.includes('admin')`, OR
   - `req.user.isAdmin === true`

If either check fails, the request is rejected with:
- **401 Unauthorized** - No user in request
- **403 Forbidden** - User is not an admin

---

## Frontend Integration

### Checking Admin Status

In your frontend components, check if the current user is an admin:

```typescript
// Get user from storage
const user = await this.storage.get('user');

// Check admin status
const isAdmin = user && (
  user.roles?.admin === true ||
  user.roles?.includes('admin') ||
  user.isAdmin === true
);

// Show/hide admin features
if (isAdmin) {
  // Show banner admin menu item
  // Allow access to /home/banner-admin
  // Allow access to /home/banner-analytics
}
```

### Protecting Routes

In your routing guards:

```typescript
export const adminGuard: CanActivateFn = async (route, state) => {
  const storage = inject(StorageService);
  const router = inject(Router);

  const user = await storage.get('user');
  const isAdmin = user?.roles?.admin === true;

  if (!isAdmin) {
    router.navigate(['/home']);
    return false;
  }

  return true;
};
```

---

## Testing Admin Access

### Test as Regular User
1. Login as normal user (without admin role)
2. Try to access `/home/banner-admin`
3. Should be redirected or show "Access Denied"
4. Banner display should still work (public endpoints)

### Test as Admin
1. Set admin role in database for your user
2. Logout and login again
3. Access `/home/banner-admin`
4. Should see banner management interface
5. Create/edit/delete banners
6. View analytics dashboard

---

## Security Recommendations

1. **Limit Admin Users**: Only give admin role to trusted users
2. **Audit Trail**: Consider logging admin actions
3. **Regular Review**: Periodically review who has admin access
4. **Strong Passwords**: Ensure admin users have strong passwords
5. **Two-Factor Auth**: Consider adding 2FA for admin users (future enhancement)

---

## Troubleshooting

### "Access Denied" Error

**Problem**: User can't access banner admin even after setting role

**Solutions**:
1. Verify role is set correctly in database:
   ```javascript
   db.users.findOne({ phone: "YOUR_PHONE" }, { roles: 1 })
   ```

2. Logout and login again to refresh user session

3. Check browser console for error messages

4. Verify authentication token is valid

### "Authentication Required" Error

**Problem**: Getting 401 error when accessing admin endpoints

**Solutions**:
1. User is not logged in - login first
2. Authentication token expired - login again
3. Token not being sent with request - check frontend HTTP service

### Admin Role Not Working

**Problem**: Role is set but middleware still denies access

**Solutions**:
1. Check exact role structure in database
2. Ensure it matches one of the supported formats:
   - `roles.admin: true`
   - `roles: ["admin"]`
   - `isAdmin: true`

3. Check backend logs for error messages

---

## Example: Creating Your First Admin

### Step 1: Find Your User ID

```bash
# In MongoDB shell
use your-database-name
db.users.find({ phone: "YOUR_PHONE_NUMBER" })
```

### Step 2: Set Admin Role

```bash
db.users.updateOne(
  { phone: "YOUR_PHONE_NUMBER" },
  { $set: { "roles.admin": true } }
)
```

### Step 3: Verify

```bash
db.users.findOne(
  { phone: "YOUR_PHONE_NUMBER" },
  { firstName: 1, phone: 1, roles: 1 }
)

# Should output:
# {
#   "_id": "...",
#   "firstName": "Your Name",
#   "phone": "YOUR_PHONE_NUMBER",
#   "roles": { "admin": true }
# }
```

### Step 4: Test

1. Logout from the app
2. Login again
3. Navigate to `/home/banner-admin`
4. You should see the banner management interface

---

## Future Enhancements

Possible additions:
- Admin user management UI
- Role-based permissions (super admin, content admin, analyst)
- Admin activity logging
- Two-factor authentication
- Admin dashboard with system overview

---

**Last Updated**: November 12, 2025
**Version**: 2.1.0 (Admin Authentication)
