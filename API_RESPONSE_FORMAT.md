# API Response Format - Frontend Integration Guide

## Overview
All API endpoints now return responses in a **standardized format**. Please update your frontend code to handle the new response structure.

---

## Success Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Example Success Response
```json
{
  "success": true,
  "data": {
    "profileId": "60d5ec49f1b2c72b8c8e4f3a",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Optional additional details"
  }
}
```

### Example Error Response
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Token has expired",
    "details": null
  }
}
```

---

## Standard Error Codes

### Authentication Errors (401)
| Error Code | Message | Description |
|------------|---------|-------------|
| `UNAUTHORIZED` | Authentication required | User not authenticated |
| `INVALID_CREDENTIALS` | Invalid credentials provided | Wrong username/password |
| `INVALID_TOKEN` | Invalid or malformed token | Token is invalid |
| `TOKEN_EXPIRED` | Token has expired | JWT token expired, refresh needed |
| `INVALID_OTP` | Invalid OTP provided | OTP verification failed |

### Not Found Errors (404)
| Error Code | Message | Description |
|------------|---------|-------------|
| `NOT_FOUND` | Resource not found | Generic not found |
| `USER_NOT_FOUND` | User not found | User doesn't exist |
| `HOSPITAL_NOT_FOUND` | Hospital not found | Hospital doesn't exist |
| `APPOINTMENT_NOT_FOUND` | Appointment not found | Appointment doesn't exist |

### Validation Errors (400)
| Error Code | Message | Description |
|------------|---------|-------------|
| `VALIDATION_ERROR` | Validation failed | Input validation failed |
| `INVALID_INPUT` | Invalid input provided | Input data is invalid |
| `MISSING_REQUIRED_FIELDS` | Required fields are missing | Required fields not provided |
| `SLOT_NOT_AVAILABLE` | Selected appointment slot is not available | Booking slot unavailable |
| `PAYMENT_FAILED` | Payment processing failed | Payment failed |

### Conflict Errors (409)
| Error Code | Message | Description |
|------------|---------|-------------|
| `DUPLICATE_ENTRY` | Duplicate entry detected | Resource already exists |
| `USER_ALREADY_EXISTS` | User already exists with this phone number | User registration conflict |

### Server Errors (500)
| Error Code | Message | Description |
|------------|---------|-------------|
| `INTERNAL_SERVER_ERROR` | Internal server error occurred | Generic server error |
| `DATABASE_ERROR` | Database operation failed | Database error |
| `EXTERNAL_SERVICE_ERROR` | External service error | Third-party service failed |
| `SMS_SEND_FAILED` | Failed to send SMS | SMS service failed |
| `EMAIL_SEND_FAILED` | Failed to send email | Email service failed |

### Service Unavailable (503)
| Error Code | Message | Description |
|------------|---------|-------------|
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable | Service down/maintenance |

---

## Frontend Implementation Guide

### 1. Update Response Handling

**Before:**
```javascript
axios.get('/api/user/123')
  .then(response => {
    // Old: response.data or response.data.data
    const user = response.data;
  })
  .catch(error => {
    // Old: error.response.data.message or various formats
    console.error(error.response.data.message);
  });
```

**After:**
```javascript
axios.get('/api/user/123')
  .then(response => {
    // New: Always access response.data.data
    if (response.data.success) {
      const user = response.data.data;
      console.log(response.data.message); // Optional message
    }
  })
  .catch(error => {
    // New: Standardized error structure
    const errorData = error.response.data;
    console.error(`Error ${errorData.error.code}: ${errorData.error.message}`);
  });
```

### 2. Generic Error Handler

```javascript
// Create a centralized error handler
function handleApiError(error) {
  if (!error.response) {
    // Network error
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection.'
    };
  }

  const errorData = error.response.data;

  if (errorData && errorData.error) {
    return {
      code: errorData.error.code,
      message: errorData.error.message,
      details: errorData.error.details
    };
  }

  // Fallback for non-standard errors
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred'
  };
}

// Usage
axios.get('/api/user/123')
  .catch(error => {
    const { code, message } = handleApiError(error);

    // Handle specific error codes
    switch(code) {
      case 'TOKEN_EXPIRED':
        // Redirect to login or refresh token
        refreshToken();
        break;
      case 'USER_NOT_FOUND':
        // Show user not found message
        showNotification(message, 'error');
        break;
      default:
        // Generic error handling
        showNotification(message, 'error');
    }
  });
```

### 3. Axios Interceptor (Recommended)

```javascript
// Setup response interceptor
axios.interceptors.response.use(
  (response) => {
    // Successful response
    return response;
  },
  (error) => {
    if (error.response) {
      const { error: apiError } = error.response.data;

      // Handle token expiration globally
      if (apiError?.code === 'TOKEN_EXPIRED') {
        // Redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Handle unauthorized globally
      if (apiError?.code === 'UNAUTHORIZED') {
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
```

### 4. TypeScript Interface (if using TypeScript)

```typescript
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Usage
const response = await axios.get<ApiSuccessResponse<User>>('/api/user/123');
if (response.data.success) {
  const user = response.data.data;
}
```

---

## Migration Checklist

- [ ] Update all API response handlers to check `response.data.success`
- [ ] Access data from `response.data.data` instead of `response.data`
- [ ] Update error handling to use `error.response.data.error.code` and `error.response.data.error.message`
- [ ] Implement centralized error handler function
- [ ] Add axios interceptor for global error handling
- [ ] Handle `TOKEN_EXPIRED` error code for automatic logout/refresh
- [ ] Update error messages displayed to users based on new error codes
- [ ] Test all critical flows (login, signup, appointments, etc.)

---

## Important Notes

1. **All responses** now include a `success` boolean field
2. **Check `success` field** before accessing data
3. **Error codes are consistent** across all endpoints
4. **HTTP status codes** are now properly aligned with error types:
   - 200: Success
   - 400: Bad Request / Validation Error
   - 401: Unauthorized / Authentication Error
   - 404: Not Found
   - 409: Conflict / Duplicate Entry
   - 500: Server Error
   - 503: Service Unavailable

5. **Backward Compatibility**: Some endpoints may still use old format temporarily. Always check for `success` field first.

---

## Questions?

Contact the backend team if you encounter:
- Endpoints not following this format
- Missing error codes
- Unclear error messages
- Any integration issues
