# Authentication Guide

## Overview

The Dubai Real Estate AI Platform uses JWT (JSON Web Token) based authentication. All protected endpoints require a valid JWT token in the Authorization header.

## How to Register and Login

### 1. Register a New User

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "buyer@example.com",
  "phone": "+971501234567",
  "password": "SecurePass123!",
  "name": "Ahmed Ali",
  "locale": "en"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

**UAE Phone Number Format:**
- Valid formats: `+971501234567`, `0501234567`
- Supported operators: 50, 52, 54, 55, 56, 58

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "buyer@example.com",
    "phone": "+971501234567",
    "name": "Ahmed Ali",
    "locale": "en",
    "roles": ["buyer"],
    "isActive": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "emailOrPhone": "buyer@example.com",
  "password": "SecurePass123!"
}
```

You can use either email or phone number for login.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "buyer@example.com",
    "roles": ["buyer"],
    "lastLoginAt": "2025-10-06T12:15:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## JWT Token Usage

### Making Authenticated Requests

Include the JWT token in the Authorization header of all protected endpoints:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Example with cURL:

```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example with JavaScript/Fetch:

```javascript
fetch('http://localhost:3000/auth/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
```

## Token Refresh Flow

**Note:** Token refresh functionality is currently a placeholder. For now, users need to re-login when their token expires.

**Endpoint:** `POST /auth/refresh`

Future implementation will support seamless token refresh.

## Role-Based Access Control

The platform supports multiple user roles:

- **buyer**: End users looking to purchase or rent properties
- **agent**: Real estate agents managing listings and leads
- **developer**: Property developers with advanced permissions
- **admin**: System administrators with full access

Roles are assigned during registration and can be updated by administrators.

## Error Handling

### Common Authentication Errors:

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid credentials"
}
```

**409 Conflict (Email/Phone Already Exists):**
```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Email already exists"
}
```

**400 Bad Request (Validation Error):**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "Password must contain at least one uppercase letter",
    "Phone number is invalid"
  ]
}
```

## Best Practices

1. **Store tokens securely**: Use httpOnly cookies or secure storage
2. **Never expose tokens**: Don't log or display tokens in client-side code
3. **Handle token expiration**: Implement proper error handling for expired tokens
4. **Use HTTPS**: Always use HTTPS in production
5. **Validate on client**: Pre-validate input before sending to API

## Security Considerations

- Passwords are hashed using bcrypt with salt rounds
- JWT tokens include user ID and roles
- Tokens expire after a configured period (default: 24 hours)
- Failed login attempts are logged for security monitoring
- PDPL compliance: User data is handled according to UAE data protection laws
