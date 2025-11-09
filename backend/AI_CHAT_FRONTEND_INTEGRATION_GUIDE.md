# AI Chat System - Frontend Integration Guide

**Version:** 1.0
**Last Updated:** 2025-01-08
**For:** Frontend Development Team

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [Request/Response Formats](#requestresponse-formats)
6. [Error Handling](#error-handling)
7. [Idempotency](#idempotency)
8. [Integration Examples](#integration-examples)
9. [UI/UX Recommendations](#uiux-recommendations)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The AI Chat System enables users to have intelligent conversations about their medical records, appointments, and general health queries. The system is **context-aware**, meaning it understands what medical data the user is asking about (visit records, lab results, prescriptions, etc.).

### Key Capabilities

- 💬 **Context-Aware Conversations** - AI understands visit records, appointments, prescriptions, and lab reports
- 🔄 **Resume Conversations** - Users can close and reopen chats without losing history
- 📱 **Multi-Context Support** - Multiple active chats for different visits/appointments
- 🔒 **Secure & Compliant** - RBAC, PHI protection, audit trails
- ⚡ **Real-time Responses** - Fast AI responses with retry support
- 📊 **Pagination** - Efficient loading of long conversation histories

---

## Features

### 1. Context Types

The system supports 5 context types:

| Context Type | Description | Use Case |
|-------------|-------------|----------|
| `VISIT` | Chat about a specific visit | "What were my test results from yesterday's visit?" |
| `APPOINTMENT` | Chat about upcoming appointment | "What should I prepare for my appointment?" |
| `PRESCRIPTION` | Chat about prescriptions | "How should I take this medication?" |
| `LAB_REPORT` | Chat about lab results | "What does my high cholesterol mean?" |
| `GENERAL` | General health questions | "What is diabetes?" |

### 2. Chat Features

- ✅ Start new conversations or resume existing ones
- ✅ Send/receive messages with AI assistant
- ✅ View full conversation history with pagination
- ✅ Retry failed messages
- ✅ Rename chat sessions
- ✅ Archive old conversations
- ✅ Delete conversations permanently
- ✅ Filter chats by family member, context type, or status

### 3. Smart Features

- **Smart Disclaimers**: Medical disclaimers appear only when relevant (not on every message)
- **Token Management**: Long medical records are automatically summarized
- **Error Recovery**: Automatic retry with exponential backoff for network issues
- **Duplicate Prevention**: Idempotency ensures no duplicate messages

---

## Authentication

All endpoints require JWT authentication.

### Headers Required

```javascript
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json",
  "Idempotency-Key": "<uuid>"  // Required for POST/PUT/PATCH/DELETE
}
```

### Getting the JWT Token

Use your existing authentication flow. The token should be included in the `Authorization` header as a Bearer token.

---

## API Endpoints

**Base URL:** `{{BASE_URL}}/api/v1/chat`

### Summary Table

| Method | Endpoint | Purpose | Idempotent |
|--------|----------|---------|------------|
| POST | `/start` | Start or resume chat | ✅ |
| POST | `/:sessionId/message` | Send message | ✅ |
| GET | `/:sessionId/messages` | Get message history | N/A |
| POST | `/:sessionId/retry` | Retry failed message | ✅ |
| GET | `/sessions` | List user's chats | N/A |
| PATCH | `/:sessionId` | Update session (rename) | ✅ |
| PUT | `/:sessionId/archive` | Archive chat | ✅ |
| DELETE | `/:sessionId` | Delete chat | ✅ |

---

## API Endpoint Details

### 1. POST `/api/v1/chat/start`

**Purpose:** Start a new chat or resume an existing one for a specific context.

**Important:** This endpoint automatically checks if an active chat exists for the same context. If yes, it returns the existing chat. If no, it creates a new one.

#### Request

```javascript
POST {{BASE_URL}}/api/v1/chat/start

Headers:
  Authorization: Bearer <jwt_token>
  Idempotency-Key: <uuid>
  Content-Type: application/json

Body:
{
  "userId": "507f1f77bcf86cd799439011",           // Required
  "familyMemberId": "507f1f77bcf86cd799439012",   // Required
  "contextType": "VISIT",                          // Required: VISIT | APPOINTMENT | PRESCRIPTION | LAB_REPORT | GENERAL
  "contextId": "12345",                            // Required for VISIT/APPOINTMENT/etc., null for GENERAL
  "contextData": {                                 // Optional
    "hospitalCode": "HOSP001",
    "patientId": "PAT12345"
  }
}
```

#### Response (201 Created or 200 OK)

```javascript
{
  "success": true,
  "data": {
    "session": {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "507f1f77bcf86cd799439011",
      "familyMemberId": "507f1f77bcf86cd799439012",
      "contextType": "VISIT",
      "contextId": "12345",
      "title": "Chat about Visit on 1/8/2025",
      "status": "ACTIVE",
      "messageCount": 1,
      "lastMessageAt": "2025-01-08T10:30:00Z",
      "createdAt": "2025-01-08T10:30:00Z",
      "updatedAt": "2025-01-08T10:30:00Z"
    },
    "messages": {
      "items": [
        {
          "_id": "507f1f77bcf86cd799439014",
          "sessionId": "507f1f77bcf86cd799439013",
          "role": "system",
          "content": "You are a helpful AI assistant...",
          "createdAt": "2025-01-08T10:30:00Z"
        }
      ],
      "pagination": {
        "total": 1,
        "limit": 50,
        "nextCursor": null,
        "hasMore": false
      }
    },
    "isNew": true  // true if new session created, false if resumed
  }
}
```

#### When to Call

- User clicks "Chat" button on a visit record
- User opens chat from appointment details
- User starts a general health conversation

---

### 2. POST `/api/v1/chat/:sessionId/message`

**Purpose:** Send a user message and get AI response.

#### Request

```javascript
POST {{BASE_URL}}/api/v1/chat/507f1f77bcf86cd799439013/message

Headers:
  Authorization: Bearer <jwt_token>
  Idempotency-Key: <uuid>
  Content-Type: application/json

Body:
{
  "message": "What do my lab results mean?"
}
```

#### Response (200 OK)

```javascript
{
  "success": true,
  "data": {
    "userMessage": {
      "_id": "507f1f77bcf86cd799439015",
      "sessionId": "507f1f77bcf86cd799439013",
      "role": "user",
      "content": "What do my lab results mean?",
      "createdAt": "2025-01-08T10:31:00Z"
    },
    "assistantMessage": {
      "_id": "507f1f77bcf86cd799439016",
      "sessionId": "507f1f77bcf86cd799439013",
      "role": "assistant",
      "content": "Based on your lab results from the visit on 1/7/2025, your cholesterol level is 210 mg/dL, which is slightly above the normal range of 200 mg/dL. This is considered borderline high...\n\n**Important Medical Disclaimer:**\nThis information is for educational purposes only...",
      "meta": {
        "provider": "openai",
        "model": "gpt-4",
        "latencyMs": 1250,
        "tokens": {
          "prompt": 450,
          "completion": 180,
          "total": 630
        }
      },
      "createdAt": "2025-01-08T10:31:01Z"
    },
    "tokenUsage": {
      "system": 350,
      "context": 1200,
      "history": 150,
      "userMessage": 12,
      "total": 1712,
      "budget": 6000,
      "remaining": 4288
    }
  }
}
```

#### Error Response (503 Service Unavailable)

```javascript
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "AI provider temporarily unavailable. Please try again.",
    "details": {
      "provider": "openai",
      "retriesAttempted": 3,
      "lastError": "Connection timeout"
    }
  }
}
```

#### When to Call

- User sends a message in the chat

---

### 3. GET `/api/v1/chat/:sessionId/messages`

**Purpose:** Load conversation history with pagination.

#### Request

```javascript
GET {{BASE_URL}}/api/v1/chat/507f1f77bcf86cd799439013/messages?limit=20&cursor=507f1f77bcf86cd799439099

Headers:
  Authorization: Bearer <jwt_token>

Query Parameters:
  limit: number (optional, default: 50, max: 100)
  cursor: string (optional, messageId for pagination)
```

#### Response (200 OK)

```javascript
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "sessionId": "507f1f77bcf86cd799439013",
        "role": "system",
        "content": "System prompt with context...",
        "createdAt": "2025-01-08T09:00:00Z"
      },
      {
        "_id": "507f1f77bcf86cd799439015",
        "sessionId": "507f1f77bcf86cd799439013",
        "role": "user",
        "content": "What do my results mean?",
        "createdAt": "2025-01-08T09:01:00Z"
      },
      {
        "_id": "507f1f77bcf86cd799439016",
        "sessionId": "507f1f77bcf86cd799439013",
        "role": "assistant",
        "content": "Based on your lab results...",
        "meta": {
          "provider": "openai",
          "model": "gpt-4",
          "latencyMs": 1250,
          "tokens": {
            "prompt": 450,
            "completion": 180,
            "total": 630
          }
        },
        "createdAt": "2025-01-08T09:01:01Z"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "nextCursor": "507f1f77bcf86cd799439088",
      "hasMore": true
    }
  }
}
```

#### When to Call

- On chat screen mount (load initial messages)
- User scrolls to top (load older messages using cursor)

---

### 4. POST `/api/v1/chat/:sessionId/retry`

**Purpose:** Retry the last message if AI response failed.

#### Request

```javascript
POST {{BASE_URL}}/api/v1/chat/507f1f77bcf86cd799439013/retry

Headers:
  Authorization: Bearer <jwt_token>
  Idempotency-Key: <uuid>
  Content-Type: application/json

Body: (empty)
```

#### Response

Same as POST `/message` endpoint.

#### When to Call

- AI response failed (user sees error message)
- User clicks "Retry" button

---

### 5. GET `/api/v1/chat/sessions`

**Purpose:** Get list of user's chat sessions.

#### Request

```javascript
GET {{BASE_URL}}/api/v1/chat/sessions?familyMemberId=507f1f77bcf86cd799439012&status=ACTIVE

Headers:
  Authorization: Bearer <jwt_token>

Query Parameters:
  familyMemberId: string (optional, filter by family member)
  contextType: string (optional, filter by context: VISIT | APPOINTMENT | etc.)
  status: string (optional, default: ACTIVE, options: ACTIVE | ARCHIVED)
```

#### Response (200 OK)

```javascript
{
  "success": true,
  "data": {
    "sessions": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "userId": "507f1f77bcf86cd799439011",
        "familyMemberId": "507f1f77bcf86cd799439012",
        "contextType": "VISIT",
        "contextId": "12345",
        "title": "Chat about Visit on 1/8/2025",
        "status": "ACTIVE",
        "messageCount": 15,
        "lastMessageAt": "2025-01-08T14:30:00Z",
        "createdAt": "2025-01-08T10:30:00Z",
        "updatedAt": "2025-01-08T14:30:00Z"
      },
      {
        "_id": "507f1f77bcf86cd799439020",
        "userId": "507f1f77bcf86cd799439011",
        "familyMemberId": "507f1f77bcf86cd799439012",
        "contextType": "APPOINTMENT",
        "contextId": "67890",
        "title": "Chat about Appointment on 1/7/2025",
        "status": "ACTIVE",
        "messageCount": 3,
        "lastMessageAt": "2025-01-07T16:00:00Z",
        "createdAt": "2025-01-07T15:45:00Z",
        "updatedAt": "2025-01-07T16:00:00Z"
      }
    ]
  }
}
```

#### When to Call

- Display "Recent Chats" list
- Show chat history screen
- User searches for old conversations

---

### 6. PATCH `/api/v1/chat/:sessionId`

**Purpose:** Update session metadata (rename chat).

#### Request

```javascript
PATCH {{BASE_URL}}/api/v1/chat/507f1f77bcf86cd799439013

Headers:
  Authorization: Bearer <jwt_token>
  Idempotency-Key: <uuid>
  Content-Type: application/json

Body:
{
  "title": "Questions about my diabetes"
}
```

#### Response (200 OK)

```javascript
{
  "success": true,
  "data": {
    "session": {
      "_id": "507f1f77bcf86cd799439013",
      "title": "Questions about my diabetes",
      // ... other fields
    }
  }
}
```

#### When to Call

- User renames a chat session

---

### 7. PUT `/api/v1/chat/:sessionId/archive`

**Purpose:** Archive a chat session (move to archived list).

#### Request

```javascript
PUT {{BASE_URL}}/api/v1/chat/507f1f77bcf86cd799439013/archive

Headers:
  Authorization: Bearer <jwt_token>
  Idempotency-Key: <uuid>
  Content-Type: application/json

Body: (empty)
```

#### Response (200 OK)

```javascript
{
  "success": true,
  "data": {
    "session": {
      "_id": "507f1f77bcf86cd799439013",
      "status": "ARCHIVED",
      // ... other fields
    }
  }
}
```

#### When to Call

- User archives an old conversation
- User long-presses and selects "Archive"

---

### 8. DELETE `/api/v1/chat/:sessionId`

**Purpose:** Permanently delete a chat session and all messages.

#### Request

```javascript
DELETE {{BASE_URL}}/api/v1/chat/507f1f77bcf86cd799439013

Headers:
  Authorization: Bearer <jwt_token>
  Idempotency-Key: <uuid>
  Content-Type: application/json

Body: (empty)
```

#### Response (200 OK)

```javascript
{
  "success": true,
  "data": {
    "message": "Session deleted successfully"
  }
}
```

#### When to Call

- User confirms deletion in confirmation dialog

---

## Request/Response Formats

### Standard Success Response

All successful responses follow this format:

```javascript
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Optional success message"  // Rarely used
}
```

### Standard Error Response

All error responses follow this format:

```javascript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Optional additional details
    }
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Display response |
| 201 | Created | New resource created |
| 400 | Bad Request | Fix request format |
| 401 | Unauthorized | Refresh token or re-login |
| 403 | Forbidden | User lacks permission |
| 404 | Not Found | Resource doesn't exist |
| 422 | Validation Error | Show field-level errors to user |
| 500 | Internal Server Error | Show generic error, retry |
| 503 | Service Unavailable | AI provider down, show retry option |

### Common Error Codes

| Error Code | HTTP | Meaning | User Action |
|-----------|------|---------|-------------|
| `UNAUTHORIZED` | 401 | Missing/invalid token | Re-login |
| `TOKEN_EXPIRED` | 401 | JWT expired | Refresh token |
| `FORBIDDEN` | 403 | No access to resource | Show "Access denied" |
| `NOT_FOUND` | 404 | Resource not found | Show "Not found" |
| `VALIDATION_ERROR` | 422 | Invalid input | Show validation errors |
| `SERVICE_UNAVAILABLE` | 503 | AI provider down | Show "Try again" button |

### Validation Error Response

```javascript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "fields": {
      "userId": "Required field",
      "contextType": "Must be one of: VISIT, APPOINTMENT, GENERAL, PRESCRIPTION, LAB_REPORT"
    }
  }
}
```

**Display:** Show red text under each invalid field with the error message.

---

## Idempotency

### What is Idempotency?

Idempotency ensures that if the same request is sent multiple times (due to network issues, user double-clicking, etc.), it's only processed once.

### How to Implement

1. **Generate UUID** for each mutating request (POST/PUT/PATCH/DELETE)
2. **Include in header**: `Idempotency-Key: <uuid>`
3. **Reuse same key** if retrying the exact same request
4. **Generate new key** for new user actions

### Example (React/JavaScript)

```javascript
import { v4 as uuidv4 } from 'uuid';

async function sendMessage(sessionId, message) {
  // Generate unique key for this request
  const idempotencyKey = uuidv4();

  try {
    const response = await fetch(`/api/v1/chat/${sessionId}/message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey  // ✅ Include this
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      // Network error - safe to retry with SAME key
      if (response.status === 0 || response.status >= 500) {
        return await retryWithSameKey(sessionId, message, idempotencyKey);
      }
    }

    return await response.json();

  } catch (error) {
    // Network failure - safe to retry with SAME key
    return await retryWithSameKey(sessionId, message, idempotencyKey);
  }
}

async function retryWithSameKey(sessionId, message, idempotencyKey) {
  // Use the SAME idempotency key to prevent duplicates
  const response = await fetch(`/api/v1/chat/${sessionId}/message`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey  // ✅ Same key
    },
    body: JSON.stringify({ message })
  });

  return await response.json();
}
```

### Cache Duration

Idempotency keys are cached for **24 hours**. After that, the same key can be reused.

---

## Integration Examples

### Example 1: Start Chat from Visit Screen

```javascript
// User clicks "Chat" button on visit details page

async function handleChatClick(visitId, hospitalCode, patientId) {
  const idempotencyKey = uuidv4();

  const response = await fetch(`${BASE_URL}/api/v1/chat/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey
    },
    body: JSON.stringify({
      userId: currentUser.id,
      familyMemberId: selectedFamilyMember.id,
      contextType: 'VISIT',
      contextId: visitId,
      contextData: {
        hospitalCode: hospitalCode,
        patientId: patientId
      }
    })
  });

  const data = await response.json();

  if (data.success) {
    const session = data.data.session;
    const messages = data.data.messages.items;

    // Navigate to chat screen
    navigation.navigate('ChatScreen', {
      sessionId: session._id,
      title: session.title,
      initialMessages: messages
    });
  } else {
    // Handle error
    showError(data.error.message);
  }
}
```

### Example 2: Send Message in Chat

```javascript
// User sends a message

async function sendMessage(sessionId, messageText) {
  const idempotencyKey = uuidv4();

  // Optimistically add user message to UI
  addMessageToUI({
    role: 'user',
    content: messageText,
    isPending: true
  });

  try {
    const response = await fetch(`${BASE_URL}/api/v1/chat/${sessionId}/message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({
        message: messageText
      })
    });

    const data = await response.json();

    if (data.success) {
      // Update UI with confirmed user message
      updateMessage(data.data.userMessage);

      // Add AI response
      addMessageToUI(data.data.assistantMessage);

    } else if (data.error.code === 'SERVICE_UNAVAILABLE') {
      // Show retry button
      showRetryButton(sessionId);

    } else {
      // Show error
      showError(data.error.message);
    }

  } catch (error) {
    // Network error - show retry button
    showRetryButton(sessionId);
  }
}
```

### Example 3: Load More Messages (Pagination)

```javascript
// User scrolls to top of chat

async function loadOlderMessages(sessionId, currentCursor) {
  const response = await fetch(
    `${BASE_URL}/api/v1/chat/${sessionId}/messages?limit=20&cursor=${currentCursor}`,
    {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    }
  );

  const data = await response.json();

  if (data.success) {
    const olderMessages = data.data.items;
    const pagination = data.data.pagination;

    // Prepend older messages to UI
    prependMessagesToUI(olderMessages);

    // Update cursor for next load
    if (pagination.hasMore) {
      setNextCursor(pagination.nextCursor);
    } else {
      // No more messages
      setHasReachedTop(true);
    }
  }
}
```

### Example 4: Display Recent Chats

```javascript
// Load user's recent chats for a family member

async function loadRecentChats(familyMemberId) {
  const response = await fetch(
    `${BASE_URL}/api/v1/chat/sessions?familyMemberId=${familyMemberId}&status=ACTIVE`,
    {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    }
  );

  const data = await response.json();

  if (data.success) {
    const sessions = data.data.sessions;

    // Display list of chats
    displayChatList(sessions);
  }
}

function displayChatList(sessions) {
  return sessions.map(session => ({
    id: session._id,
    title: session.title,
    lastMessage: `${session.messageCount} messages`,
    lastActivity: formatDate(session.lastMessageAt),
    contextType: session.contextType,
    onTap: () => openChat(session._id)
  }));
}
```

---

## UI/UX Recommendations

### 1. Chat Entry Points

**Where to add "Chat" buttons:**

✅ Visit details screen
✅ Appointment details screen
✅ Prescription screen
✅ Lab report screen
✅ General health section (no specific context)

### 2. Chat Screen Layout

```
┌─────────────────────────────────┐
│  ← Back    Chat Title    ⋮ Menu │
├─────────────────────────────────┤
│                                 │
│  [System Message - Collapsed]   │
│                                 │
│  You: What do my results mean?  │
│  10:30 AM                       │
│                                 │
│  ┌───────────────────────────┐ │
│  │ AI: Based on your lab     │ │
│  │ results from yesterday... │ │
│  │ [Read More]               │ │
│  │ 10:30 AM                  │ │
│  └───────────────────────────┘ │
│                                 │
│  [Load older messages...]       │
│                                 │
├─────────────────────────────────┤
│ [Text Input]          [Send ➤]  │
└─────────────────────────────────┘
```

### 3. Message States

**User Message:**
- ✅ Sent (checkmark)
- ⏳ Sending (spinner)
- ❌ Failed (with retry button)

**AI Message:**
- ⏳ Typing... (animated dots)
- ✅ Received (show message)
- ❌ Failed (with retry button)

### 4. Loading States

```javascript
// On chat screen open
if (loading) {
  return <LoadingSpinner message="Loading chat..." />;
}

// On send message
if (sendingMessage) {
  // Show "AI is typing..." indicator
}

// On pagination
if (loadingOlderMessages) {
  // Show spinner at top of messages
}
```

### 5. Error States

**Network Error:**
```
❌ Message failed to send
[Retry] [Cancel]
```

**AI Provider Error:**
```
⚠️ AI is temporarily unavailable
Please try again in a moment
[Retry]
```

**Permission Error:**
```
🔒 You don't have access to this chat
```

### 6. Empty States

**No Chats:**
```
💬 No conversations yet

Start a chat by visiting a medical record
or asking a general health question.

[Start General Chat]
```

**New Chat:**
```
👋 Hello! I'm here to help you understand
your medical information.

What would you like to know?
```

### 7. Context Indicators

Show what the chat is about:

```
📋 Visit Chat - Dr. Smith (Jan 7, 2025)
📅 Appointment Chat - Cardiology (Jan 10, 2025)
💊 Prescription Chat - Metformin
🧪 Lab Results Chat - Blood Test (Jan 7, 2025)
❓ General Health Questions
```

### 8. Smart Features to Highlight

- **Auto-save**: "All conversations are automatically saved"
- **Resume**: "Continue where you left off"
- **Context-aware**: "AI understands your medical records"
- **Secure**: "Your data is encrypted and protected"

---

## Best Practices

### 1. Performance

✅ **Paginate messages** - Load 20-50 messages at a time
✅ **Cache sessions** - Store session list locally
✅ **Optimistic updates** - Show user message immediately
✅ **Debounce typing** - Don't send on every keystroke

### 2. User Experience

✅ **Show typing indicator** when AI is responding
✅ **Disable send button** while waiting for response
✅ **Auto-scroll** to bottom on new message
✅ **Preserve scroll position** when loading older messages
✅ **Show timestamps** on messages
✅ **Group messages by date**

### 3. Error Handling

✅ **Show user-friendly errors** (not technical jargon)
✅ **Provide retry buttons** for failed messages
✅ **Log errors** to your analytics (but redact PHI!)
✅ **Handle token expiration** gracefully

### 4. Security

✅ **Never log message content** (contains PHI)
✅ **Validate user owns family member** before chat
✅ **Use HTTPS only**
✅ **Store JWT securely**

### 5. Accessibility

✅ **Screen reader support** for messages
✅ **Keyboard navigation**
✅ **High contrast mode** support
✅ **Text size scaling**

---

## Troubleshooting

### Problem: "Chat session not found" (404)

**Cause:** Session was deleted or user doesn't have access

**Solution:**
```javascript
if (error.code === 'NOT_FOUND') {
  // Navigate back to chat list
  navigation.goBack();
  showToast('This chat no longer exists');
}
```

### Problem: "Access denied" (403)

**Cause:** User trying to access another user's chat or family member they don't own

**Solution:**
```javascript
if (error.code === 'FORBIDDEN') {
  showAlert('Access Denied', 'You do not have permission to view this chat');
  navigation.goBack();
}
```

### Problem: Duplicate messages appearing

**Cause:** Not using idempotency keys

**Solution:**
```javascript
// ❌ WRONG - no idempotency key
fetch('/api/v1/chat/start', { ... });

// ✅ CORRECT - include idempotency key
fetch('/api/v1/chat/start', {
  headers: {
    'Idempotency-Key': uuidv4()  // Add this
  }
});
```

### Problem: "Token expired" (401)

**Cause:** JWT expired

**Solution:**
```javascript
if (error.code === 'TOKEN_EXPIRED') {
  // Refresh token
  await refreshAuthToken();

  // Retry original request
  return await retryRequest();
}
```

### Problem: AI response is slow

**Expected:** AI responses typically take 1-3 seconds

**If slower:**
- Check network connection
- Large medical records take longer (context is being loaded)
- Show "AI is analyzing your records..." message

### Problem: Messages not updating in real-time

**Cause:** Not polling or using optimistic updates

**Solution:**
```javascript
// Optimistically add message
addMessageToUI(userMessage);

// Send to server
const response = await sendMessage();

// Update with server confirmation
updateMessageInUI(response.data.userMessage);
addMessageToUI(response.data.assistantMessage);
```

---

## Complete Integration Flow

### Scenario: User asks about visit lab results

```
1. User views visit details
   └─> Sees "Chat about this visit" button

2. User taps "Chat" button
   └─> App calls POST /api/v1/chat/start
       {
         contextType: 'VISIT',
         contextId: visitId,
         ...
       }

3. Backend checks for existing ACTIVE chat
   └─> If exists: Returns existing session
   └─> If new: Creates session, loads EMR data

4. App receives response
   └─> Navigates to ChatScreen
   └─> Displays system message + any previous messages

5. User types: "What do my lab results mean?"
   └─> App generates idempotency key
   └─> Shows message in UI (optimistic)
   └─> Calls POST /:sessionId/message

6. Backend processes message
   └─> Loads conversation history
   └─> Applies token budgeting
   └─> Calls OpenAI
   └─> Returns AI response

7. App receives response
   └─> Updates user message (confirmed)
   └─> Displays AI message
   └─> Shows disclaimer (if first message)

8. User closes app
   └─> Chat is automatically saved

9. User reopens app later
   └─> Sees chat in "Recent Chats" list
   └─> Taps chat
   └─> Calls GET /sessions (to list)
   └─> Calls POST /start (to resume)
   └─> Continues conversation from where they left off
```

---

## Testing Checklist for Frontend

- [ ] Start new VISIT chat
- [ ] Start new APPOINTMENT chat
- [ ] Start GENERAL chat (no context)
- [ ] Resume existing chat
- [ ] Send message successfully
- [ ] Handle AI provider timeout (503)
- [ ] Handle token expiration (401)
- [ ] Handle permission error (403)
- [ ] Pagination - load older messages
- [ ] Retry failed message
- [ ] Rename chat
- [ ] Archive chat
- [ ] Delete chat
- [ ] View chat list
- [ ] Filter chats by family member
- [ ] Idempotency - send same message twice (should not duplicate)
- [ ] Offline handling
- [ ] Optimistic UI updates

---

## Support & Questions

For questions or issues:

1. **Check this guide first**
2. **Review API response format** - errors contain detailed information
3. **Check browser/app console** for error details
4. **Contact backend team** with:
   - Endpoint called
   - Request body
   - Response received
   - User ID (for debugging)

---

## Appendix: Quick Reference

### Context Types
```
VISIT         → "Chat about this visit"
APPOINTMENT   → "Chat about appointment"
PRESCRIPTION  → "Chat about prescription"
LAB_REPORT    → "Chat about lab results"
GENERAL       → "Ask health questions"
```

### Idempotency Key Generation

**JavaScript/TypeScript:**
```javascript
import { v4 as uuidv4 } from 'uuid';
const key = uuidv4();
```

**Flutter/Dart:**
```dart
import 'package:uuid/uuid.dart';
final key = Uuid().v4();
```

**Swift:**
```swift
import Foundation
let key = UUID().uuidString
```

### Error Code Quick Reference

| Code | Status | Meaning |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Re-login required |
| `TOKEN_EXPIRED` | 401 | Refresh token |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource missing |
| `VALIDATION_ERROR` | 422 | Invalid input |
| `SERVICE_UNAVAILABLE` | 503 | Retry later |

---

**Document Version:** 1.0
**Last Updated:** January 8, 2025
**Maintained By:** Backend Team
