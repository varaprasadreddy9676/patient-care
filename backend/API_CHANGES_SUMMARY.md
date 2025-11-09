# API Response Format Changes - Quick Summary

## 🚨 Action Required: Update Your API Response Handling

### What Changed?

All API responses now follow a **standardized format** with consistent error codes.

---

## New Response Structures

### ✅ Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### ❌ Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

---

## Key Changes for Frontend

### Before ❌
```javascript
// Accessing data
const user = response.data; // or response.data.data

// Error handling
catch(error) {
  console.log(error.response.data.message); // Inconsistent
}
```

### After ✅
```javascript
// Accessing data
const user = response.data.data;

// Error handling
catch(error) {
  const { code, message } = error.response.data.error;
  console.log(`${code}: ${message}`);
}
```

---

## Common Error Codes to Handle

| Code | HTTP Status | Action Required |
|------|-------------|-----------------|
| `TOKEN_EXPIRED` | 401 | Logout user or refresh token |
| `INVALID_TOKEN` | 401 | Logout user |
| `INVALID_OTP` | 401 | Show OTP error message |
| `USER_NOT_FOUND` | 404 | Show user not found message |
| `VALIDATION_ERROR` | 400 | Show validation errors |
| `INTERNAL_SERVER_ERROR` | 500 | Show generic error |

---

## Quick Implementation

```javascript
// Add this interceptor to your axios setup
axios.interceptors.response.use(
  response => response,
  error => {
    const errorCode = error.response?.data?.error?.code;

    if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN') {
      // Logout user
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
```

---

## Timeline

**Effective Immediately** - Backend is now returning standardized responses.

Please update your frontend code ASAP to avoid issues.

---

## Full Documentation

See `API_RESPONSE_FORMAT.md` for complete error codes list and detailed implementation guide.

## Support

Contact backend team for any questions or integration issues.
