# AI Chat System - Production-Ready Development Guide v2.0

## 📋 Table of Contents
1. [Overview](#overview)
2. [Critical Changes from v1](#critical-changes-from-v1)
3. [Architecture](#architecture)
4. [Database Schema (Corrected)](#database-schema-corrected)
5. [API Endpoints (Enhanced)](#api-endpoints-enhanced)
6. [Idempotency & Retries](#idempotency--retries)
7. [Context Token Budgeting](#context-token-budgeting)
8. [Consent & Access Control](#consent--access-control)
9. [File Structure](#file-structure)
10. [Implementation Checklist (Updated)](#implementation-checklist-updated)
11. [Code Specifications (Production-Ready)](#code-specifications-production-ready)
12. [Testing Checklist (Enhanced)](#testing-checklist-enhanced)
13. [Configuration](#configuration)
14. [Frontend Integration](#frontend-integration)

---

## Overview

### Goal
Build a production-ready, provider-agnostic AI chat system with:
- Context-aware conversations (VISIT, APPOINTMENT, GENERAL)
- Full chat history with resume capability
- Idempotent message handling
- Proper access control and audit trails
- Token budgeting and cost awareness
- Retry logic with circuit breaking

### Key Principles
- **Provider Agnostic**: Easy to switch between OpenAI, Claude, Gemini
- **Production Ready**: Idempotency, pagination, RBAC, PHI redaction
- **Context Aware**: Automatically loads relevant medical data
- **Secure**: Access control, consent, audit trails
- **Observable**: Token tracking, latency metrics, error telemetry

---

## Critical Changes from v1

### ⚠️ BREAKING CHANGES

1. **Models now export models, not schemas** - Fixes registration issues
2. **Unique index on active sessions** - Prevents duplicate chats
3. **Single status field** - Removed redundant `active` boolean from sessions
4. **Message metadata** - Track tokens, latency, provider per message
5. **Idempotency keys** - Prevent duplicate messages on retries
6. **Pagination** - Handle large chat histories
7. **RBAC checks** - Validate userId ↔ familyMemberId ownership
8. **PHI redaction** - Never log medical content
9. **Retry logic** - Exponential backoff with circuit breaking
10. **Smart disclaimers** - Only on first message and when medically relevant

### 🆕 NEW FEATURES

- Idempotency system for all POST operations
- Paginated message history
- Optional streaming endpoint (SSE)
- Token budgeting and truncation
- Per-message metadata (tokens, latency, model)
- Retry endpoint for failed messages
- Session renaming
- Provider switching per session

---

## Architecture

### Enhanced Flow with Idempotency

```
User Action (UI)
    ↓
Frontend calls POST /api/v1/chat/start
  + Idempotency-Key header
    ↓
ChatController → Check idempotency cache
    ↓
If cached: return cached response
If new: Process request
    ↓
ChatService.startOrResumeChat()
    ↓
RBAC Check: userId owns familyMemberId
    ↓
Check unique session (userId, familyMemberId, contextType, contextId, status=ACTIVE)
    ↓
If exists: Load session + paginated messages
If new: Create session + build context
    ↓
ContextBuilderService (with token budgeting)
    ↓
Return session + cache response
    ↓
User sends message with Idempotency-Key
    ↓
Check idempotency → Provider (with retry/backoff)
    ↓
Capture tokens, latency, model in message.meta
    ↓
Save messages + update session stats
    ↓
Audit trail (PHI redacted)
    ↓
Return response
```

---

## Database Schema (Corrected)

### Collection 1: `chat_sessions`

```javascript
{
  _id: ObjectId,
  userId: ObjectId,               // Reference to User (indexed)
  familyMemberId: ObjectId,       // Reference to family_member (indexed)

  // Context System
  contextType: String,            // 'VISIT', 'APPOINTMENT', 'PRESCRIPTION', 'GENERAL', 'LAB_REPORT'
  contextId: String,              // visitId, appointmentId, etc. (null for GENERAL)
  contextData: Mixed,             // Flexible context storage

  // Metadata
  title: String,                  // Auto-generated or user-set
  status: String,                 // 'ACTIVE' or 'ARCHIVED' (indexed)

  // Statistics
  messageCount: Number,           // Total messages
  lastMessageAt: Date,            // Last activity

  // Multi-tenant (optional)
  tenantId: String,               // For SaaS deployments (indexed)

  // Timestamps (auto-managed)
  createdAt: Date,                // From timestamps: true
  updatedAt: Date                 // From timestamps: true
}

// CRITICAL INDEXES
1. { userId: 1, familyMemberId: 1, contextType: 1, contextId: 1, status: 1 }
   - Unique for ACTIVE sessions (prevents duplicates)
   - Partial filter: { status: 'ACTIVE' }

2. { userId: 1, status: 1 } - List user's chats
3. { tenantId: 1 } - Multi-tenant queries
```

### Collection 2: `chat_messages`

```javascript
{
  _id: ObjectId,
  sessionId: ObjectId,            // Reference to chat_session (indexed)

  role: String,                   // 'user', 'assistant', 'system', 'tool'
  content: String,                // Message text

  // Metadata (NEW - critical for observability)
  meta: {
    provider: String,             // 'openai', 'anthropic', 'gemini'
    model: String,                // 'gpt-4', 'claude-3-sonnet', etc.
    latencyMs: Number,            // Response time
    tokens: {
      prompt: Number,
      completion: Number,
      total: Number
    },
    toolCalls: [                  // For function calling (future)
      { name: String, args: Object }
    ],
    errorCode: String,            // If message failed
    retryCount: Number            // How many retries
  },

  active: Boolean,                // Soft delete for messages

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}

// INDEXES
1. { sessionId: 1, createdAt: 1 } - Ordered message history
2. { sessionId: 1, active: 1 } - Active messages only
```

### Collection 3: `chat_idempotency` (NEW)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,               // Who made the request
  sessionId: ObjectId,            // Which session (nullable for /start)
  idempotencyKey: String,         // Client-provided key (indexed, unique)

  endpoint: String,               // '/start', '/message', etc.
  requestBody: Mixed,             // Original request
  response: Mixed,                // Cached response

  createdAt: Date,                // Auto-expire after 24 hours
}

// INDEX with TTL
{ idempotencyKey: 1 }, { unique: true }
{ createdAt: 1 }, { expireAfterSeconds: 86400 }  // 24 hour TTL
```

---

## API Endpoints (Enhanced)

### Base Route: `/api/v1/chat`

| Method | Endpoint | Idempotent | Description |
|--------|----------|------------|-------------|
| POST | `/start` | ✅ | Start or resume chat |
| POST | `/:sessionId/message` | ✅ | Send message |
| POST | `/:sessionId/message/stream` | ✅ | Send message (SSE streaming) |
| POST | `/:sessionId/retry` | ✅ | Retry last failed message |
| GET | `/:sessionId` | N/A | Get session details |
| GET | `/:sessionId/messages` | N/A | Get paginated messages |
| GET | `/sessions` | N/A | List user's chats |
| PATCH | `/:sessionId` | ✅ | Update session (rename, etc.) |
| PUT | `/:sessionId/archive` | ✅ | Archive chat |
| DELETE | `/:sessionId` | ✅ | Delete chat permanently |

### Headers (All Requests)

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
Idempotency-Key: <uuid>  // Required for POST/PUT/PATCH/DELETE
```

---

### Detailed Endpoint Specifications

#### 1. POST `/api/v1/chat/start`

**Headers**:
```
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

**Request Body**:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "familyMemberId": "507f1f77bcf86cd799439012",
  "contextType": "VISIT",
  "contextId": "12345",
  "contextData": {
    "hospitalCode": "HOSP001",
    "patientId": "PAT12345"
  }
}
```

**RBAC Check**: Verify `userId` owns `familyMemberId` before proceeding.

**Idempotency**: If same key seen within 24h, return cached response.

**Unique Session Logic**:
- Check for existing ACTIVE session with same (userId, familyMemberId, contextType, contextId)
- If exists: Return existing session
- If not: Create new session

**Success Response** (200 or 201):
```json
{
  "success": true,
  "data": {
    "session": {
      "_id": "507f1f77bcf86cd799439013",
      "title": "Chat about Visit on 12-Jan-2025",
      "contextType": "VISIT",
      "contextId": "12345",
      "status": "ACTIVE",
      "messageCount": 5,
      "lastMessageAt": "2025-01-12T10:30:00Z",
      "createdAt": "2025-01-12T09:00:00Z"
    },
    "messages": {
      "items": [ /* first page of messages */ ],
      "pagination": {
        "total": 5,
        "limit": 50,
        "cursor": null,
        "hasMore": false
      }
    }
  }
}
```

**Error Responses**:

```json
// 403 Forbidden - RBAC failure
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "User does not have access to this family member"
  }
}

// 422 Validation Error
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

---

#### 2. POST `/api/v1/chat/:sessionId/message`

**Headers**:
```
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440001
```

**Request Body**:
```json
{
  "message": "What do my lab results mean?"
}
```

**Process**:
1. Check idempotency cache
2. Verify session exists and user has access
3. Save user message to DB
4. Load conversation history (max 20 messages, token-budgeted)
5. Call AI provider with retry/backoff
6. Capture response metadata (tokens, latency, model)
7. Save assistant message with metadata
8. Update session stats (messageCount++, lastMessageAt)
9. Cache response with idempotency key

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "userMessage": {
      "_id": "...",
      "role": "user",
      "content": "What do my lab results mean?",
      "createdAt": "2025-01-12T10:30:00Z"
    },
    "assistantMessage": {
      "_id": "...",
      "role": "assistant",
      "content": "Based on your lab results from the visit on 12-Jan-2025...",
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
      "createdAt": "2025-01-12T10:30:01Z"
    }
  }
}
```

**Error Responses**:

```json
// 503 Provider Failure (after retries)
{
  "success": false,
  "error": {
    "code": "AI_PROVIDER_ERROR",
    "message": "AI provider temporarily unavailable. Please try again.",
    "details": {
      "provider": "openai",
      "retriesAttempted": 3,
      "lastError": "Connection timeout"
    }
  }
}
```

---

#### 3. GET `/api/v1/chat/:sessionId/messages`

**Purpose**: Paginated message history

**Query Parameters**:
- `cursor` (optional) - Cursor for pagination (messageId)
- `limit` (optional, default: 50, max: 100)

**Request**:
```
GET /api/v1/chat/507f1f77bcf86cd799439013/messages?limit=20&cursor=507f1f77bcf86cd799439099
```

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "...",
        "role": "system",
        "content": "Context loaded for visit...",
        "createdAt": "2025-01-12T09:00:00Z"
      },
      {
        "_id": "...",
        "role": "user",
        "content": "What do my results mean?",
        "createdAt": "2025-01-12T09:01:00Z"
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

---

#### 4. POST `/api/v1/chat/:sessionId/retry`

**Purpose**: Safely retry last assistant message if it failed

**Headers**:
```
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440002
```

**Request Body**: (empty)

**Process**:
1. Find last user message in session
2. Check if last assistant message exists and failed (has errorCode in meta)
3. If failed or missing, retry with same user message
4. Use fresh idempotency key for provider call
5. Save new attempt with retryCount++

**Response**: Same as POST /message

---

#### 5. PATCH `/api/v1/chat/:sessionId`

**Purpose**: Update session metadata

**Headers**:
```
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440003
```

**Request Body**:
```json
{
  "title": "My Visit Questions"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "session": { /* updated session */ }
  }
}
```

---

## Idempotency & Retries

### Why Idempotency Matters

In healthcare applications:
- Network failures are common (mobile users)
- Duplicate messages create confusion
- Billing/cost implications with AI APIs
- Audit trail integrity

### Implementation

#### Client-Side
```javascript
import { v4 as uuidv4 } from 'uuid';

async function sendMessage(sessionId, message) {
  const idempotencyKey = uuidv4();

  const response = await fetch(`/api/v1/chat/${sessionId}/message`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey
    },
    body: JSON.stringify({ message })
  });

  // Safe to retry with SAME key if timeout/network error
  if (!response.ok && shouldRetry(response.status)) {
    // Retry with same idempotency key
    return await sendMessage(sessionId, message);
  }

  return response.json();
}

function shouldRetry(status) {
  return status === 0 || status >= 500 || status === 408;
}
```

#### Server-Side
```javascript
// Middleware: src/middleware/idempotency.js
async function idempotencyMiddleware(req, res, next) {
  const methods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (!methods.includes(req.method)) {
    return next();
  }

  const key = req.headers['idempotency-key'];

  if (!key) {
    return ResponseHandler.error(res,
      new AppError(ErrorCodes.VALIDATION_ERROR, 'Idempotency-Key header required'),
      422
    );
  }

  // Check cache
  const cached = await IdempotencyCache.get(key);

  if (cached) {
    console.log(`Idempotency hit: ${key}`);
    return res.status(cached.status).json(cached.body);
  }

  // Store original res.json to intercept response
  const originalJson = res.json.bind(res);

  res.json = function(body) {
    // Cache successful responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      IdempotencyCache.set(key, {
        status: res.statusCode,
        body: body,
        userId: req.user?._id
      });
    }

    return originalJson(body);
  };

  next();
}
```

### Retry Logic with Exponential Backoff

```javascript
// src/utils/RetryHelper.js
async function withBackoff(fn, options = {}) {
  const {
    retries = 3,
    baseDelayMs = 250,
    maxDelayMs = 5000,
    shouldRetry = (err) => true
  } = options;

  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;

      if (attempt > retries || !shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt - 1),
        maxDelayMs
      );

      console.log(`Retry ${attempt}/${retries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

module.exports = { withBackoff };
```

---

## Context Token Budgeting

### Problem
- GPT-4: 8K context window
- Claude: 200K context window
- Visit EMR data can be 10K+ tokens
- Need to fit: system prompt + context + history + user message

### Solution: Smart Truncation

```javascript
// src/services/TokenBudgetService.js
const { encoding_for_model } = require('tiktoken');

class TokenBudgetService {
  constructor() {
    this.encoders = new Map();
  }

  getEncoder(model) {
    if (!this.encoders.has(model)) {
      try {
        this.encoders.set(model, encoding_for_model(model));
      } catch {
        // Fallback to gpt-4 encoder
        this.encoders.set(model, encoding_for_model('gpt-4'));
      }
    }
    return this.encoders.get(model);
  }

  countTokens(text, model = 'gpt-4') {
    const encoder = this.getEncoder(model);
    return encoder.encode(text).length;
  }

  /**
   * Budget tokens for a conversation
   * @param {Object} params
   * @param {string} params.systemPrompt
   * @param {string} params.contextText
   * @param {Array} params.messages - Previous messages
   * @param {string} params.userMessage - New user message
   * @param {string} params.model - Model name
   * @param {number} params.maxContextTokens - Max tokens for entire context
   * @param {number} params.reserveForResponse - Tokens to reserve for response
   */
  budgetConversation(params) {
    const {
      systemPrompt,
      contextText,
      messages = [],
      userMessage,
      model = 'gpt-4',
      maxContextTokens = 6000,  // Leave room for 2K response
      reserveForResponse = 2000
    } = params;

    const budget = maxContextTokens - reserveForResponse;

    // Fixed costs (can't truncate)
    const systemTokens = this.countTokens(systemPrompt, model);
    const userMessageTokens = this.countTokens(userMessage, model);
    const fixedCost = systemTokens + userMessageTokens;

    if (fixedCost > budget) {
      throw new Error(`System prompt + user message exceeds budget: ${fixedCost} > ${budget}`);
    }

    const remaining = budget - fixedCost;

    // Split remaining budget: 60% context, 40% history
    const contextBudget = Math.floor(remaining * 0.6);
    const historyBudget = Math.floor(remaining * 0.4);

    // Truncate context if needed
    const truncatedContext = this.truncateToTokenLimit(
      contextText,
      contextBudget,
      model
    );

    // Truncate history (keep most recent messages)
    const truncatedHistory = this.truncateHistory(
      messages,
      historyBudget,
      model
    );

    return {
      systemPrompt,
      context: truncatedContext,
      history: truncatedHistory,
      userMessage,
      tokenUsage: {
        system: systemTokens,
        context: this.countTokens(truncatedContext, model),
        history: truncatedHistory.reduce((sum, msg) =>
          sum + this.countTokens(msg.content, model), 0
        ),
        userMessage: userMessageTokens,
        total: fixedCost +
               this.countTokens(truncatedContext, model) +
               truncatedHistory.reduce((sum, msg) =>
                 sum + this.countTokens(msg.content, model), 0
               )
      }
    };
  }

  truncateToTokenLimit(text, maxTokens, model) {
    const encoder = this.getEncoder(model);
    const tokens = encoder.encode(text);

    if (tokens.length <= maxTokens) {
      return text;
    }

    // Truncate and add indicator
    const truncated = encoder.decode(tokens.slice(0, maxTokens - 20));
    return truncated + '\n\n[...context truncated due to length...]';
  }

  truncateHistory(messages, maxTokens, model) {
    const result = [];
    let tokenCount = 0;

    // Process messages in reverse (most recent first)
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const msgTokens = this.countTokens(msg.content, model);

      if (tokenCount + msgTokens > maxTokens) {
        break;
      }

      result.unshift(msg);
      tokenCount += msgTokens;
    }

    return result;
  }
}

module.exports = new TokenBudgetService();
```

### Budget Allocation Strategy

| Component | % of Budget | Typical Tokens | Can Truncate? |
|-----------|-------------|----------------|---------------|
| System Prompt | Fixed | 200-400 | ❌ No |
| Visit Context | 35% | 1500-2000 | ✅ Yes (with indicator) |
| Conversation History | 25% | 1000-1500 | ✅ Yes (keep recent) |
| User Message | Fixed | 50-200 | ❌ No |
| Reserved for Response | 40% | 2000 | N/A |

---

## Consent & Access Control

### RBAC Checks

Every chat operation must verify:
1. **User Authentication**: Valid JWT token
2. **Family Member Ownership**: userId owns familyMemberId
3. **Session Ownership**: userId owns the chat session
4. **Context Access**: User has permission to access contextId (visit/appointment)

```javascript
// src/middleware/chatAuth.js
async function validateChatAccess(req, res, next) {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await ChatSession.findById(sessionId);

    if (!session) {
      return ResponseHandler.error(res,
        new AppError(ErrorCodes.NOT_FOUND, 'Chat session not found'),
        404
      );
    }

    // Check ownership
    if (session.userId.toString() !== userId.toString()) {
      return ResponseHandler.error(res,
        new AppError(ErrorCodes.FORBIDDEN, 'Access denied'),
        403
      );
    }

    req.session = session;
    next();

  } catch (error) {
    console.error('Chat auth error:', error);
    return ResponseHandler.error(res,
      new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Authorization check failed'),
      500
    );
  }
}

async function validateFamilyMemberAccess(req, res, next) {
  try {
    const { userId, familyMemberId } = req.body;
    const authenticatedUserId = req.user._id;

    // Verify authenticated user matches userId in request
    if (userId !== authenticatedUserId.toString()) {
      return ResponseHandler.error(res,
        new AppError(ErrorCodes.FORBIDDEN, 'User ID mismatch'),
        403
      );
    }

    // Verify user owns family member
    const familyMember = await FamilyMember.findById(familyMemberId);

    if (!familyMember) {
      return ResponseHandler.error(res,
        new AppError(ErrorCodes.NOT_FOUND, 'Family member not found'),
        404
      );
    }

    if (familyMember.userId.toString() !== userId) {
      return ResponseHandler.error(res,
        new AppError(ErrorCodes.FORBIDDEN, 'Access denied to family member'),
        403
      );
    }

    req.familyMember = familyMember;
    next();

  } catch (error) {
    console.error('Family member auth error:', error);
    return ResponseHandler.error(res,
      new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Authorization check failed'),
      500
    );
  }
}

module.exports = { validateChatAccess, validateFamilyMemberAccess };
```

### Consent Management

```javascript
// Before starting chat about a visit, verify consent
async function checkVisitChatConsent(userId, visitId, hospitalCode) {
  // Check if user has consented to AI features
  const user = await User.findById(userId);

  if (!user.consents?.aiChat) {
    throw new AppError(
      ErrorCodes.CONSENT_REQUIRED,
      'AI chat consent required. Please accept AI features consent in settings.'
    );
  }

  // Log consent check in audit trail
  auditTrailService.log(null, 'AI_CHAT_CONSENT_VERIFIED',
    `User ${userId} accessed AI chat for visit ${visitId}`
  );

  return true;
}
```

---

## File Structure

```
medics-care-app-server/
│
├── src/
│   ├── models/
│   │   ├── ChatSession.js              ✨ NEW (exports model)
│   │   ├── ChatMessage.js              ✨ NEW (exports model)
│   │   └── ChatIdempotency.js          ✨ NEW (exports model)
│   │
│   ├── controllers/
│   │   └── ChatController.js           ✨ NEW (10 endpoints)
│   │
│   ├── services/
│   │   ├── ai/
│   │   │   ├── AIProviderInterface.js  ✨ NEW
│   │   │   ├── AIProviderFactory.js    ✨ NEW
│   │   │   └── providers/
│   │   │       ├── OpenAIProvider.js   ✨ NEW (with retry)
│   │   │       ├── AnthropicProvider.js ✨ NEW (future)
│   │   │       └── GeminiProvider.js   ✨ NEW (future)
│   │   │
│   │   ├── ChatService.js              ✨ NEW (core logic)
│   │   ├── ContextBuilderService.js    ✨ NEW (with budgeting)
│   │   ├── TokenBudgetService.js       ✨ NEW
│   │   └── IdempotencyService.js       ✨ NEW
│   │
│   ├── middleware/
│   │   ├── idempotency.js              ✨ NEW
│   │   └── chatAuth.js                 ✨ NEW (RBAC checks)
│   │
│   ├── config/
│   │   └── aiConfig.js                 ✨ NEW
│   │
│   └── utils/
│       ├── AIPromptTemplates.js        ✨ NEW
│       ├── RetryHelper.js              ✨ NEW
│       └── PHIRedactor.js              ✨ NEW (log safety)
│
├── .env                                (Add AI API keys)
├── AI_CHAT_SYSTEM_DEVELOPMENT_GUIDE_V2.md ✅ THIS FILE
└── package.json                        (Add: tiktoken, uuid)
```

---

## Implementation Checklist (Updated)

### ✅ Phase 1: Database Models & Infrastructure (Day 1)

#### Task 1.1: Create ChatSession Model ⚡ CRITICAL FIXES
- [ ] Create `src/models/ChatSession.js`
- [ ] **Export model, NOT schema** (`module.exports = mongoose.model(...)`)
- [ ] Use single `status` field (remove `active` boolean)
- [ ] Add `timestamps: true`, remove manual createdAt/updatedAt
- [ ] **Add unique index for ACTIVE sessions**:
  ```javascript
  { userId: 1, familyMemberId: 1, contextType: 1, contextId: 1, status: 1 }
  with partialFilterExpression: { status: 'ACTIVE' }
  ```
- [ ] Add indexes: `{ userId: 1, status: 1 }`, `{ tenantId: 1 }`
- [ ] Test model creation in MongoDB
- [ ] Verify unique constraint prevents duplicate ACTIVE chats

#### Task 1.2: Create ChatMessage Model ⚡ CRITICAL FIXES
- [ ] Create `src/models/ChatMessage.js`
- [ ] **Export model, NOT schema**
- [ ] Add `meta` object with:
  - `provider`, `model`, `latencyMs`
  - `tokens: { prompt, completion, total }`
  - `errorCode`, `retryCount`
- [ ] Add 'tool' to role enum (future function calling)
- [ ] Add indexes: `{ sessionId: 1, createdAt: 1 }`, `{ sessionId: 1, active: 1 }`
- [ ] Test model creation

#### Task 1.3: Create ChatIdempotency Model
- [ ] Create `src/models/ChatIdempotency.js`
- [ ] Add unique index on `idempotencyKey`
- [ ] Add TTL index: `{ createdAt: 1 }, { expireAfterSeconds: 86400 }`
- [ ] Test auto-expiration after 24 hours

#### Task 1.4: Install Dependencies
- [ ] `npm install tiktoken` (token counting)
- [ ] `npm install uuid` (idempotency keys)
- [ ] Verify installations

---

### ✅ Phase 2: AI Provider System with Retry Logic (Day 2)

#### Task 2.1: Create Retry Helper
- [ ] Create `src/utils/RetryHelper.js`
- [ ] Implement `withBackoff(fn, options)` function
- [ ] Add exponential backoff calculation
- [ ] Add `shouldRetry` predicate support
- [ ] Test with mock failures

#### Task 2.2: Create Provider Interface
- [ ] Create `src/services/ai/AIProviderInterface.js`
- [ ] Define base class with `chat()` method
- [ ] Add `getName()` method
- [ ] Document interface contract

#### Task 2.3: Create OpenAI Provider ⚡ PRODUCTION READY
- [ ] Create `src/services/ai/providers/OpenAIProvider.js`
- [ ] Integrate `withBackoff` for retries
- [ ] Add 30-second timeout
- [ ] **Capture response metadata**:
  - Extract tokens from `response.data.usage`
  - Calculate latency (start/end timestamps)
  - Store model name
- [ ] Handle errors gracefully (400, 429, 500)
- [ ] Return structured response: `{ content, meta: {...} }`
- [ ] Test with real OpenAI API
- [ ] Test retry on timeout/500 error

#### Task 2.4: Create Provider Factory ⚡ GUARD MISSING CONFIG
- [ ] Create `src/services/ai/AIProviderFactory.js`
- [ ] **Validate config before creating provider**:
  ```javascript
  if (!config.apiKey) throw new Error('API key missing')
  ```
- [ ] Add provider selection logic
- [ ] Handle unknown provider errors
- [ ] Test with missing API key (should throw)
- [ ] Test with valid config

#### Task 2.5: Create AI Configuration
- [ ] Create `src/config/aiConfig.js`
- [ ] Define `activeProvider` setting
- [ ] Add provider configs (openai, anthropic, gemini)
- [ ] Add token budget settings
- [ ] Update `.env` with API keys:
  ```
  OPENAI_API_KEY=sk-...
  ANTHROPIC_API_KEY=sk-ant-...
  GEMINI_API_KEY=...
  ```

---

### ✅ Phase 3: Idempotency & Auth Middleware (Day 3)

#### Task 3.1: Create Idempotency Service
- [ ] Create `src/services/IdempotencyService.js`
- [ ] Implement `get(key)` - check cache
- [ ] Implement `set(key, response, userId)` - cache response
- [ ] Use ChatIdempotency model with 24h TTL
- [ ] Test cache hit/miss scenarios

#### Task 3.2: Create Idempotency Middleware
- [ ] Create `src/middleware/idempotency.js`
- [ ] Check for `Idempotency-Key` header on POST/PUT/PATCH/DELETE
- [ ] Return 422 if missing
- [ ] Check cache before processing
- [ ] Intercept response to cache successful results
- [ ] Test with duplicate keys

#### Task 3.3: Create Chat Auth Middleware
- [ ] Create `src/middleware/chatAuth.js`
- [ ] Implement `validateChatAccess(req, res, next)`:
  - Verify sessionId exists
  - Verify session.userId === authenticated user
  - Attach session to `req.session`
- [ ] Implement `validateFamilyMemberAccess(req, res, next)`:
  - Verify userId === authenticated user
  - Verify familyMember.userId === userId
  - Attach familyMember to `req.familyMember`
- [ ] Return 403 on access violations
- [ ] Test with unauthorized access attempts

---

### ✅ Phase 4: Token Budgeting (Day 3)

#### Task 4.1: Create Token Budget Service
- [ ] Create `src/services/TokenBudgetService.js`
- [ ] Implement `countTokens(text, model)` using tiktoken
- [ ] Implement `budgetConversation(params)`:
  - Calculate token usage for all components
  - Allocate budget: 35% context, 25% history, 40% response
  - Truncate context if needed
  - Truncate history (keep recent messages)
  - Return budgeted conversation parts
- [ ] Implement `truncateToTokenLimit(text, maxTokens, model)`
- [ ] Implement `truncateHistory(messages, maxTokens, model)`
- [ ] Test with large contexts (>10K tokens)
- [ ] Test with long conversation histories

---

### ✅ Phase 5: Context Building with Budgeting (Days 4-5)

#### Task 5.1: Create Prompt Templates ⚡ SMART DISCLAIMERS
- [ ] Create `src/utils/AIPromptTemplates.js`
- [ ] Define system prompts for VISIT, APPOINTMENT, GENERAL, PRESCRIPTION
- [ ] **Smart disclaimer strategy**:
  - Include in system prompt as guideline
  - Only append to first assistant message
  - Append when user asks treatment/diagnosis questions
  - NOT on every response (avoid spam)
- [ ] Add `shouldIncludeDisclaimer(userMessage, isFirstResponse)` logic
- [ ] Test prompts don't exceed 400 tokens

#### Task 5.2: Create Context Builder Service
- [ ] Create `src/services/ContextBuilderService.js`
- [ ] Implement `buildContext(contextType, contextId, data)` router
- [ ] Import TokenBudgetService
- [ ] Integrate with existing HTTPService for EMR data

#### Task 5.3: Build Visit Context ⚡ WITH BUDGETING
- [ ] Implement `buildVisitContext(visitId, data)` method
- [ ] Fetch EMR data via HTTPService
- [ ] Fetch lab reports, prescriptions, radiology, discharge summary
- [ ] Format data into structured text
- [ ] **Apply token budget** (max 2000 tokens for context)
- [ ] Truncate if needed with indicator
- [ ] Return: `{ systemPrompt, contextText, metadata, tokenCount }`
- [ ] Test with real visit data
- [ ] Verify truncation works on large visits

#### Task 5.4: Build Appointment Context
- [ ] Implement `buildAppointmentContext(appointmentId)` method
- [ ] Fetch appointment from MongoDB
- [ ] Format appointment details (date, doctor, specialty, etc.)
- [ ] Apply token budget (typically <500 tokens)
- [ ] Return formatted context
- [ ] Test with real appointments

#### Task 5.5: Build General Context
- [ ] Implement `buildGeneralContext(userData)` method
- [ ] Return minimal context (no patient data)
- [ ] Use general health assistant prompt
- [ ] Test

#### Task 5.6: Helper Methods
- [ ] Implement `formatLabReports(reports)`
- [ ] Implement `formatPrescriptions(prescriptions)`
- [ ] Implement `formatRadiologyReports(reports)`
- [ ] Test formatting outputs are concise

---

### ✅ Phase 6: Chat Service with Metadata Tracking (Day 6)

#### Task 6.1: Create Chat Service Foundation
- [ ] Create `src/services/ChatService.js`
- [ ] Import models: ChatSession, ChatMessage, FamilyMember
- [ ] Import services: ContextBuilder, TokenBudget, AIProviderFactory
- [ ] Initialize AI provider from config

#### Task 6.2: Start/Resume Chat Logic ⚡ UNIQUE SESSION
- [ ] Implement `startOrResumeChat(params)` method
- [ ] **Check for existing ACTIVE session**:
  ```javascript
  const existing = await ChatSession.findOne({
    userId, familyMemberId, contextType, contextId, status: 'ACTIVE'
  });
  ```
- [ ] If exists: Return existing session + paginated messages
- [ ] If new:
  - Verify no duplicate via unique index (catch E11000 error)
  - Build context via ContextBuilderService
  - Generate title (auto or from context)
  - Create new ChatSession
  - Save system message with context
  - Return session + messages
- [ ] Test duplicate prevention
- [ ] Test resume with existing messages

#### Task 6.3: Send Message Logic ⚡ WITH METADATA
- [ ] Implement `sendMessage(sessionId, userMessage)` method
- [ ] Validate session exists
- [ ] Save user message to ChatMessage
- [ ] Load conversation history (last 20 messages)
- [ ] **Use TokenBudgetService** to build budgeted conversation
- [ ] Format messages for AI provider (OpenAI format)
- [ ] Call provider with retry logic
- [ ] **Capture response metadata**:
  ```javascript
  const { content, meta } = await provider.chat(messages);
  // meta = { tokens: {...}, latencyMs, model, provider }
  ```
- [ ] Save assistant message with meta
- [ ] Update session: `messageCount++`, `lastMessageAt`
- [ ] Return both messages with metadata
- [ ] Test token capture
- [ ] Test with provider timeout

#### Task 6.4: Pagination Logic
- [ ] Implement `getSessionMessages(sessionId, cursor, limit)` method
- [ ] Default limit: 50, max: 100
- [ ] Query: `ChatMessage.find({ sessionId, active: true })`
- [ ] If cursor: Add `{ _id: { $lt: cursor } }` to query
- [ ] Sort by `createdAt: -1` (newest first)
- [ ] Return: `{ items, pagination: { total, limit, nextCursor, hasMore } }`
- [ ] Test with 100+ message session

#### Task 6.5: Session Management
- [ ] Implement `getUserSessions(userId, filters)` method
- [ ] Support filters: familyMemberId, contextType, status
- [ ] Sort by `lastMessageAt: -1`
- [ ] Return list of sessions
- [ ] Implement `updateSession(sessionId, updates)` method (for renaming)
- [ ] Implement `archiveSession(sessionId)` - set status='ARCHIVED'
- [ ] Implement `deleteSession(sessionId)` - hard delete session + messages
- [ ] Test all operations

#### Task 6.6: Retry Logic
- [ ] Implement `retryLastMessage(sessionId)` method
- [ ] Find last user message
- [ ] Check if assistant response failed (has errorCode in meta)
- [ ] If failed/missing, retry with fresh provider call
- [ ] Increment retryCount in meta
- [ ] Test retry recovery

---

### ✅ Phase 7: Chat Controller with Validation (Day 7)

#### Task 7.1: Install Validation Library
- [ ] Choose: Joi or Zod (recommend Zod for TypeScript-like schemas)
- [ ] `npm install joi` or `npm install zod`
- [ ] Create validation schemas

#### Task 7.2: Create Controller Foundation
- [ ] Create `src/controllers/ChatController.js`
- [ ] Import ChatService, ResponseHandler, ErrorCodes
- [ ] Import middleware: idempotency, chatAuth
- [ ] Import validation library
- [ ] Set up module exports with app and route

#### Task 7.3: Define Validation Schemas
- [ ] Create schema for POST /start:
  ```javascript
  const startChatSchema = Joi.object({
    userId: Joi.string().required(),
    familyMemberId: Joi.string().required(),
    contextType: Joi.string().valid('VISIT', 'APPOINTMENT', 'GENERAL', 'PRESCRIPTION', 'LAB_REPORT').required(),
    contextId: Joi.string().allow(null),
    contextData: Joi.object().default({})
  });
  ```
- [ ] Create schema for POST /message:
  ```javascript
  const sendMessageSchema = Joi.object({
    message: Joi.string().min(1).max(2000).required()
  });
  ```
- [ ] Create schema for PATCH /session

#### Task 7.4: POST /start Endpoint ⚡ WITH RBAC
- [ ] Create endpoint handler
- [ ] Apply middleware: `idempotencyMiddleware`, `validateFamilyMemberAccess`
- [ ] Validate request body with schema
- [ ] Return 422 on validation failure with field-level errors
- [ ] Call ChatService.startOrResumeChat()
- [ ] Handle RBAC 403 errors
- [ ] Handle duplicate session errors (E11000)
- [ ] Return success response
- [ ] Test with Postman
- [ ] Test unauthorized access (different userId)

#### Task 7.5: POST /:sessionId/message Endpoint ⚡ WITH METADATA
- [ ] Create endpoint handler
- [ ] Apply middleware: `idempotencyMiddleware`, `validateChatAccess`
- [ ] Validate request body
- [ ] Call ChatService.sendMessage()
- [ ] **Return response with metadata**:
  ```json
  {
    "assistantMessage": {
      "content": "...",
      "meta": { "tokens": {...}, "latencyMs": 1250, ... }
    }
  }
  ```
- [ ] Handle provider errors (503)
- [ ] Test with Postman
- [ ] Test idempotency (same key twice)

#### Task 7.6: GET /:sessionId/messages Endpoint
- [ ] Create endpoint handler
- [ ] Apply middleware: `validateChatAccess`
- [ ] Parse query params: cursor, limit
- [ ] Validate limit (max 100)
- [ ] Call ChatService.getSessionMessages()
- [ ] Return paginated response
- [ ] Test pagination with cursor

#### Task 7.7: POST /:sessionId/retry Endpoint
- [ ] Create endpoint handler
- [ ] Apply middleware: `idempotencyMiddleware`, `validateChatAccess`
- [ ] Call ChatService.retryLastMessage()
- [ ] Return same format as /message
- [ ] Test recovery from failed message

#### Task 7.8: GET /sessions Endpoint
- [ ] Create endpoint handler
- [ ] Parse query: userId, familyMemberId, contextType, status
- [ ] Validate userId matches authenticated user
- [ ] Call ChatService.getUserSessions()
- [ ] Return list of sessions
- [ ] Test filtering

#### Task 7.9: PATCH /:sessionId Endpoint
- [ ] Create endpoint handler
- [ ] Apply middleware: `idempotencyMiddleware`, `validateChatAccess`
- [ ] Validate body (only allow title updates for now)
- [ ] Call ChatService.updateSession()
- [ ] Return updated session
- [ ] Test renaming

#### Task 7.10: PUT /:sessionId/archive Endpoint
- [ ] Create endpoint handler
- [ ] Apply middleware: `idempotencyMiddleware`, `validateChatAccess`
- [ ] Call ChatService.archiveSession()
- [ ] Return success
- [ ] Test archival

#### Task 7.11: DELETE /:sessionId Endpoint
- [ ] Create endpoint handler
- [ ] Apply middleware: `idempotencyMiddleware`, `validateChatAccess`
- [ ] Call ChatService.deleteSession()
- [ ] Return success
- [ ] Test deletion + verify messages deleted

---

### ✅ Phase 8: Integration & PHI Safety (Day 8)

#### Task 8.1: Create PHI Redactor
- [ ] Create `src/utils/PHIRedactor.js`
- [ ] Implement redaction for:
  - Patient names (replace with [NAME])
  - Phone numbers
  - Email addresses
  - Medical record numbers
  - Dates of birth
  - Specific medical conditions (keep general terms)
- [ ] Apply to all console.log/winston logs
- [ ] Test redaction accuracy

#### Task 8.2: Register Routes
- [ ] Find main app file (medics-care.js)
- [ ] Import ChatController
- [ ] Register route: `ChatController(app, '/api/v1/chat')`
- [ ] Apply global JWT auth middleware
- [ ] Test route registration (GET /api/v1/chat/sessions should 401 without token)

#### Task 8.3: Audit Trail Integration
- [ ] Add events to AuditTrailService:
  - `CHAT_SESSION_STARTED`
  - `CHAT_MESSAGE_SENT`
  - `CHAT_SESSION_ARCHIVED`
  - `CHAT_SESSION_DELETED`
  - `AI_PROVIDER_CALLED`
  - `AI_PROVIDER_FAILED`
- [ ] Log events in ChatService methods
- [ ] **Redact PHI** from audit logs (use PHIRedactor)
- [ ] Test audit trail entries

#### Task 8.4: Error Handling Review
- [ ] Verify all errors use ResponseHandler
- [ ] Verify proper HTTP status codes (400, 403, 404, 422, 500, 503)
- [ ] Verify error responses match API_RESPONSE_FORMAT.md
- [ ] Test error scenarios:
  - Invalid userId (403)
  - Non-existent sessionId (404)
  - Validation errors (422)
  - Provider timeout (503)
  - Network errors (500)

---

### ✅ Phase 9: Testing (Days 9-10)

#### Task 9.1: Security Tests ⚡ CRITICAL
- [ ] **Unauthorized access test**:
  - User A creates chat
  - User B tries to access User A's sessionId
  - Should return 403 Forbidden
- [ ] **Family member access test**:
  - User tries to create chat for familyMemberId they don't own
  - Should return 403
- [ ] **JWT validation**:
  - Request without Authorization header → 401
  - Request with invalid token → 401
  - Request with expired token → 401

#### Task 9.2: Idempotency Tests
- [ ] Send POST /start with key "abc123"
- [ ] Send again with same key
- [ ] Verify same response returned (no duplicate session)
- [ ] Send POST /message with key "def456"
- [ ] Send again with same key
- [ ] Verify no duplicate message in DB
- [ ] Wait 25 hours, try same key → should process as new

#### Task 9.3: Token Budgeting Tests
- [ ] Create visit with 15KB of EMR data
- [ ] Start chat, verify context is truncated
- [ ] Verify "[...context truncated...]" indicator present
- [ ] Send 30 messages to build long history
- [ ] Send new message, verify only recent 10-15 messages included
- [ ] Verify total tokens < 6000

#### Task 9.4: Provider Retry Tests
- [ ] Mock provider to fail with 500 error
- [ ] Send message, verify retries 3 times
- [ ] Verify exponential backoff delays
- [ ] Mock timeout (>30s), verify request aborted
- [ ] Verify error logged with retryCount in meta

#### Task 9.5: Pagination Tests
- [ ] Create session with 150 messages
- [ ] GET /messages with limit=50
- [ ] Verify 50 items returned + nextCursor
- [ ] Use nextCursor to get next page
- [ ] Verify correct messages returned
- [ ] Continue until hasMore=false

#### Task 9.6: Context Tests
- [ ] **VISIT context**:
  - Create chat with valid visitId
  - Verify EMR data loaded
  - Verify lab reports formatted correctly
  - Send: "What were my test results?"
  - Verify AI references specific values
- [ ] **APPOINTMENT context**:
  - Create chat with appointmentId
  - Verify appointment details loaded
  - Send: "When is my appointment?"
  - Verify correct date/time returned
- [ ] **GENERAL context**:
  - Create chat with contextType=GENERAL, contextId=null
  - Send: "What is diabetes?"
  - Verify general information provided
  - Verify disclaimer included

#### Task 9.7: End-to-End Scenarios
- [ ] **Complete visit chat flow**:
  1. User views visit record in app
  2. Clicks "Chat" button
  3. Frontend calls POST /start with VISIT context
  4. Chat UI opens with system message
  5. User sends 3 questions about lab results
  6. User closes chat
  7. User reopens chat (same visit)
  8. Verify history persists
  9. User archives chat
  10. Verify status=ARCHIVED
- [ ] **Multi-context scenario**:
  1. Create chat for Visit A
  2. Create chat for Visit B (same user, same family member)
  3. Verify two separate ACTIVE sessions exist
  4. Send messages to both
  5. List sessions, verify both appear
  6. Archive Visit A chat
  7. Verify only Visit B is ACTIVE

#### Task 9.8: Load Testing (Optional for MVP)
- [ ] Use Apache Bench or Artillery
- [ ] Target: 95p latency <3s for POST /message
- [ ] Test: 10 concurrent users, 50 messages each
- [ ] Verify no errors, all messages saved
- [ ] Check database for duplicate messages (should be 0)

---

## Code Specifications (Production-Ready)

### 1. ChatSession Model

```javascript
// src/models/ChatSession.js
const mongoose = require('mongoose');

const ChatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'user',
    index: true
  },

  familyMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'family_member',
    index: true
  },

  // Context System
  contextType: {
    type: String,
    required: true,
    enum: ['VISIT', 'APPOINTMENT', 'PRESCRIPTION', 'GENERAL', 'LAB_REPORT'],
    index: true
  },

  contextId: {
    type: String,
    default: null,
    index: true
  },

  contextData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Metadata
  title: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ['ACTIVE', 'ARCHIVED'],
    default: 'ACTIVE',
    index: true
  },

  // Statistics
  messageCount: {
    type: Number,
    default: 0
  },

  lastMessageAt: {
    type: Date,
    default: Date.now
  },

  // Multi-tenant (optional)
  tenantId: {
    type: String,
    index: true
  }
}, {
  timestamps: true  // Auto-manages createdAt, updatedAt
});

// CRITICAL: Unique index for active sessions
// Prevents duplicate ACTIVE chats for same context
ChatSessionSchema.index(
  {
    userId: 1,
    familyMemberId: 1,
    contextType: 1,
    contextId: 1,
    status: 1
  },
  {
    unique: true,
    partialFilterExpression: { status: 'ACTIVE' }
  }
);

// Additional indexes
ChatSessionSchema.index({ userId: 1, status: 1 });
ChatSessionSchema.index({ tenantId: 1 });

// Export MODEL, not schema
module.exports = mongoose.model('chat_session', ChatSessionSchema);
```

### 2. ChatMessage Model

```javascript
// src/models/ChatMessage.js
const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'chat_session',
    index: true
  },

  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant', 'system', 'tool']
  },

  content: {
    type: String,
    required: true
  },

  // Metadata for observability
  meta: {
    provider: String,              // 'openai', 'anthropic', 'gemini'
    model: String,                 // 'gpt-4', 'claude-3-sonnet', etc.
    latencyMs: Number,             // Response time
    tokens: {
      prompt: Number,
      completion: Number,
      total: Number
    },
    toolCalls: [{                  // For function calling (future)
      name: String,
      args: mongoose.Schema.Types.Mixed
    }],
    errorCode: String,             // If message failed
    retryCount: {
      type: Number,
      default: 0
    }
  },

  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
ChatMessageSchema.index({ sessionId: 1, createdAt: 1 });
ChatMessageSchema.index({ sessionId: 1, active: 1 });

// Export MODEL
module.exports = mongoose.model('chat_message', ChatMessageSchema);
```

### 3. ChatIdempotency Model

```javascript
// src/models/ChatIdempotency.js
const mongoose = require('mongoose');

const ChatIdempotencySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'user'
  },

  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'chat_session'
  },

  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  endpoint: {
    type: String,
    required: true
  },

  requestBody: {
    type: mongoose.Schema.Types.Mixed
  },

  response: {
    type: mongoose.Schema.Types.Mixed
  },

  statusCode: {
    type: Number,
    default: 200
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// TTL index - auto-delete after 24 hours
ChatIdempotencySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 86400 }
);

module.exports = mongoose.model('chat_idempotency', ChatIdempotencySchema);
```

### 4. OpenAI Provider (Production-Ready)

```javascript
// src/services/ai/providers/OpenAIProvider.js
const AIProviderInterface = require('../AIProviderInterface');
const axios = require('axios');
const { withBackoff } = require('../../../utils/RetryHelper');

class OpenAIProvider extends AIProviderInterface {
  constructor(apiKey, defaultModel = 'gpt-4') {
    super();

    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
    this.baseURL = 'https://api.openai.com/v1';
  }

  async chat(messages, options = {}) {
    const startTime = Date.now();

    const makeRequest = async () => {
      try {
        const response = await axios.post(
          `${this.baseURL}/chat/completions`,
          {
            model: options.model || this.defaultModel,
            messages: messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 1500
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000  // 30 second timeout
          }
        );

        const latencyMs = Date.now() - startTime;

        if (response.data?.choices?.[0]?.message?.content) {
          return {
            content: response.data.choices[0].message.content,
            meta: {
              provider: 'openai',
              model: response.data.model || this.defaultModel,
              latencyMs: latencyMs,
              tokens: {
                prompt: response.data.usage?.prompt_tokens || 0,
                completion: response.data.usage?.completion_tokens || 0,
                total: response.data.usage?.total_tokens || 0
              }
            }
          };
        }

        throw new Error('Invalid response from OpenAI');

      } catch (error) {
        // Determine if error is retryable
        const isRetryable =
          error.code === 'ECONNABORTED' ||  // Timeout
          error.code === 'ETIMEDOUT' ||
          (error.response?.status >= 500) || // Server errors
          error.response?.status === 429;    // Rate limit

        if (error.response) {
          const errorMessage = error.response.data?.error?.message || error.message;
          const enhancedError = new Error(`OpenAI API Error: ${errorMessage}`);
          enhancedError.status = error.response.status;
          enhancedError.isRetryable = isRetryable;
          throw enhancedError;
        }

        error.isRetryable = isRetryable;
        throw error;
      }
    };

    // Retry with exponential backoff
    try {
      return await withBackoff(makeRequest, {
        retries: 3,
        baseDelayMs: 250,
        maxDelayMs: 5000,
        shouldRetry: (err) => err.isRetryable
      });
    } catch (error) {
      console.error('OpenAI Provider Error after retries:', error.message);

      // Return error metadata
      return {
        content: null,
        meta: {
          provider: 'openai',
          model: this.defaultModel,
          latencyMs: Date.now() - startTime,
          tokens: { prompt: 0, completion: 0, total: 0 },
          errorCode: error.status || 'PROVIDER_ERROR',
          error: error.message
        }
      };
    }
  }
}

module.exports = OpenAIProvider;
```

### 5. AI Provider Factory (With Guards)

```javascript
// src/services/ai/AIProviderFactory.js
const OpenAIProvider = require('./providers/OpenAIProvider');
// Future: const AnthropicProvider = require('./providers/AnthropicProvider');
// Future: const GeminiProvider = require('./providers/GeminiProvider');

class AIProviderFactory {
  /**
   * Create AI provider instance with validation
   * @param {string} providerName - Provider name
   * @param {Object} config - Provider configuration
   * @returns {AIProviderInterface} Provider instance
   */
  static create(providerName, config = {}) {
    const name = (providerName || '').toLowerCase();

    switch (name) {
      case 'openai':
        if (!config.apiKey) {
          throw new Error('OpenAI API key is missing in configuration');
        }
        return new OpenAIProvider(config.apiKey, config.model);

      // Future providers
      // case 'anthropic':
      //   if (!config.apiKey) {
      //     throw new Error('Anthropic API key is missing');
      //   }
      //   return new AnthropicProvider(config.apiKey, config.model);

      default:
        throw new Error(`Unknown AI provider: ${providerName}`);
    }
  }
}

module.exports = AIProviderFactory;
```

### 6. Idempotency Middleware

```javascript
// src/middleware/idempotency.js
const ChatIdempotency = require('../models/ChatIdempotency');
const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');

async function idempotencyMiddleware(req, res, next) {
  const idempotentMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  // Skip for GET requests
  if (!idempotentMethods.includes(req.method)) {
    return next();
  }

  const key = req.headers['idempotency-key'];

  // Require idempotency key
  if (!key) {
    return ResponseHandler.error(
      res,
      new AppError(ErrorCodes.VALIDATION_ERROR, 'Idempotency-Key header is required'),
      422
    );
  }

  try {
    // Check cache
    const cached = await ChatIdempotency.findOne({ idempotencyKey: key });

    if (cached) {
      console.log(`Idempotency cache hit: ${key}`);
      return res.status(cached.statusCode).json(cached.response);
    }

    // Intercept response to cache it
    const originalJson = res.json.bind(res);

    res.json = async function(body) {
      // Only cache successful responses (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await ChatIdempotency.create({
            userId: req.user?._id,
            sessionId: req.params?.sessionId || req.body?.sessionId,
            idempotencyKey: key,
            endpoint: req.path,
            requestBody: req.body,
            response: body,
            statusCode: res.statusCode
          });
        } catch (err) {
          // Log but don't fail request if caching fails
          console.error('Idempotency cache error:', err.message);
        }
      }

      return originalJson(body);
    };

    next();

  } catch (error) {
    console.error('Idempotency middleware error:', error);
    // Continue processing even if idempotency check fails
    next();
  }
}

module.exports = idempotencyMiddleware;
```

### 7. Chat Auth Middleware (RBAC)

```javascript
// src/middleware/chatAuth.js
const ChatSession = require('../models/ChatSession');
const FamilyMember = require('../models/FamilyMember');
const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');

/**
 * Validate user has access to chat session
 */
async function validateChatAccess(req, res, next) {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id.toString();

    const session = await ChatSession.findById(sessionId);

    if (!session) {
      return ResponseHandler.error(
        res,
        new AppError(ErrorCodes.NOT_FOUND, 'Chat session not found'),
        404
      );
    }

    // Verify ownership
    if (session.userId.toString() !== userId) {
      console.warn(`Unauthorized chat access attempt: user ${userId} tried to access session ${sessionId}`);
      return ResponseHandler.error(
        res,
        new AppError(ErrorCodes.FORBIDDEN, 'Access denied to this chat session'),
        403
      );
    }

    // Attach session to request
    req.chatSession = session;
    next();

  } catch (error) {
    console.error('Chat access validation error:', error);
    return ResponseHandler.error(
      res,
      new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Authorization check failed'),
      500
    );
  }
}

/**
 * Validate user has access to family member
 */
async function validateFamilyMemberAccess(req, res, next) {
  try {
    const { userId, familyMemberId } = req.body;
    const authenticatedUserId = req.user._id.toString();

    // Verify authenticated user matches request userId
    if (userId !== authenticatedUserId) {
      console.warn(`User ID mismatch: authenticated=${authenticatedUserId}, requested=${userId}`);
      return ResponseHandler.error(
        res,
        new AppError(ErrorCodes.FORBIDDEN, 'User ID mismatch'),
        403
      );
    }

    // Verify family member exists and belongs to user
    const familyMember = await FamilyMember.findById(familyMemberId);

    if (!familyMember) {
      return ResponseHandler.error(
        res,
        new AppError(ErrorCodes.NOT_FOUND, 'Family member not found'),
        404
      );
    }

    if (familyMember.userId.toString() !== userId) {
      console.warn(`Unauthorized family member access: user ${userId} tried to access family member ${familyMemberId}`);
      return ResponseHandler.error(
        res,
        new AppError(ErrorCodes.FORBIDDEN, 'Access denied to this family member'),
        403
      );
    }

    // Attach to request
    req.familyMember = familyMember;
    next();

  } catch (error) {
    console.error('Family member access validation error:', error);
    return ResponseHandler.error(
      res,
      new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Authorization check failed'),
      500
    );
  }
}

module.exports = {
  validateChatAccess,
  validateFamilyMemberAccess
};
```

---

## Testing Checklist (Enhanced)

### Security Tests (CRITICAL)

- [ ] **Test 1: Unauthorized session access**
  - Create session as User A
  - Attempt to access with User B's token
  - Expected: 403 Forbidden

- [ ] **Test 2: Family member ownership**
  - User A owns Family Member X
  - User B tries to create chat for Family Member X
  - Expected: 403 Forbidden

- [ ] **Test 3: Missing JWT**
  - Request without Authorization header
  - Expected: 401 Unauthorized

- [ ] **Test 4: Invalid JWT**
  - Request with malformed token
  - Expected: 401 Unauthorized

- [ ] **Test 5: Expired JWT**
  - Request with expired token
  - Expected: 401 Unauthorized with TOKEN_EXPIRED code

### Idempotency Tests

- [ ] **Test 6: Duplicate POST /start**
  - Send with key "test-123"
  - Send again with same key
  - Expected: Same response, no duplicate session in DB

- [ ] **Test 7: Duplicate POST /message**
  - Send message with key "msg-456"
  - Send again with same key
  - Expected: Same response, no duplicate message in DB

- [ ] **Test 8: TTL expiration**
  - Send request with key "old-key"
  - Wait 25 hours (or manually delete from DB)
  - Send again with "old-key"
  - Expected: Processed as new request

### Load & Chaos Tests

- [ ] **Test 9: Concurrent message sending**
  - 10 users send 10 messages each simultaneously
  - Expected: All messages saved correctly, no race conditions

- [ ] **Test 10: Provider timeout**
  - Mock provider with 35-second delay
  - Send message
  - Expected: Request times out after 30s, errorCode in meta

- [ ] **Test 11: Provider 500 errors**
  - Mock provider to return 500
  - Send message
  - Expected: Retries 3 times, final 503 response

- [ ] **Test 12: Network failure**
  - Disconnect network mid-request
  - Expected: Graceful error, can retry with same idempotency key

---

## Production Considerations

### Must-Do Before Launch

- [ ] Add rate limiting per user (max 10 messages/minute)
- [ ] Set up monitoring alerts for:
  - AI provider error rate >5%
  - Average latency >3s
  - Failed auth attempts
- [ ] Implement cost alerts (token usage)
- [ ] Add consent UI and enforcement
- [ ] Set up database backups
- [ ] Configure log rotation (PHI-safe logs only)
- [ ] Add HIPAA compliance review
- [ ] Performance test with 100+ concurrent users

### Nice-to-Have

- [ ] Redis caching for common questions
- [ ] Message search functionality
- [ ] Export chat as PDF
- [ ] Multi-language support
- [ ] Voice input
- [ ] SSE streaming for real-time responses

---

## Development Progress Tracker

### Phase 1: Database & Infrastructure ⬜
- [ ] ChatSession model (with unique index)
- [ ] ChatMessage model (with meta)
- [ ] ChatIdempotency model (with TTL)
- [ ] Dependencies installed

### Phase 2: AI Provider System ⬜
- [ ] RetryHelper utility
- [ ] AIProviderInterface
- [ ] OpenAIProvider (with retry & metadata)
- [ ] AIProviderFactory (with guards)
- [ ] AI Configuration

### Phase 3: Middleware ⬜
- [ ] Idempotency middleware
- [ ] Chat auth middleware (RBAC)

### Phase 4: Token Budgeting ⬜
- [ ] TokenBudgetService
- [ ] Integration tests

### Phase 5: Context Building ⬜
- [ ] Prompt templates (smart disclaimers)
- [ ] ContextBuilderService
- [ ] Visit context (with budgeting)
- [ ] Appointment context
- [ ] General context

### Phase 6: Chat Service ⬜
- [ ] Start/Resume logic (unique session)
- [ ] Send message (with metadata)
- [ ] Pagination
- [ ] Session management
- [ ] Retry logic

### Phase 7: Chat Controller ⬜
- [ ] Validation schemas
- [ ] POST /start
- [ ] POST /:sessionId/message
- [ ] GET /:sessionId/messages
- [ ] POST /:sessionId/retry
- [ ] GET /sessions
- [ ] PATCH /:sessionId
- [ ] PUT /:sessionId/archive
- [ ] DELETE /:sessionId

### Phase 8: Integration ⬜
- [ ] PHI redactor
- [ ] Route registration
- [ ] Audit trail
- [ ] Error handling review

### Phase 9: Testing ⬜
- [ ] Security tests (5 tests)
- [ ] Idempotency tests (3 tests)
- [ ] Load tests (4 tests)
- [ ] Context tests
- [ ] End-to-end scenarios

---

**Document Version**: 2.0 (Production-Ready)
**Last Updated**: 2025-01-08
**Changes from v1**: Added idempotency, RBAC, token budgeting, metadata tracking, pagination, PHI safety
**Status**: Ready for Production Implementation
