# AI Chat System - Implementation Quick Reference

## 🎯 Sprint Checklist (Backend Must-Do)

Use this checklist alongside the comprehensive guide (`AI_CHAT_SYSTEM_DEVELOPMENT_GUIDE_V2.md`).

---

## ⚡ Critical Fixes from Review (DO FIRST)

### Models
- [ ] ✅ Export **models**, not schemas (`module.exports = mongoose.model(...)`)
- [ ] ✅ Add unique index for ACTIVE sessions to prevent duplicates
- [ ] ✅ Use `timestamps: true`, remove manual createdAt/updatedAt
- [ ] ✅ Add `meta` object to ChatMessage (tokens, latency, provider, model)
- [ ] ✅ Remove redundant `active` from ChatSession (use `status` only)

### API
- [ ] ✅ Implement idempotency keys on all POST/PUT/PATCH/DELETE
- [ ] ✅ Add pagination to GET /:sessionId/messages
- [ ] ✅ Add request validation (Joi/Zod) - return 422 with field errors
- [ ] ✅ Capture metadata (tokens, latency) on every AI response

### Security
- [ ] ✅ Add RBAC checks: userId ↔ familyMemberId ownership
- [ ] ✅ Validate session ownership before any operation
- [ ] ✅ Return 403 on unauthorized access (not 404)
- [ ] ✅ Redact PHI from all logs (create PHIRedactor utility)

### Provider
- [ ] ✅ Add retry logic with exponential backoff
- [ ] ✅ Guard missing config in Factory (throw if no API key)
- [ ] ✅ Set 30-second timeout on provider calls
- [ ] ✅ Handle 429, 500, timeout errors gracefully

### Smart Features
- [ ] ✅ Implement token budgeting (truncate context/history intelligently)
- [ ] ✅ Smart disclaimers (only first message + treatment questions, not every response)

---

## 📋 Day-by-Day Sprint Plan

### Day 1: Database Models ✅
```
✅ Install: tiktoken, uuid, joi/zod
✅ ChatSession model with unique index
✅ ChatMessage model with meta object
✅ ChatIdempotency model with TTL
✅ Test: unique constraint prevents duplicate ACTIVE sessions
```

### Day 2: Provider System ✅
```
✅ RetryHelper utility (exponential backoff)
✅ AIProviderInterface base class
✅ OpenAIProvider with retry & metadata capture
✅ AIProviderFactory with config guards
✅ aiConfig.js with provider settings
✅ Test: provider returns tokens/latency in meta
```

### Day 3: Middleware ✅
```
✅ IdempotencyService (cache get/set)
✅ Idempotency middleware (check key, cache response)
✅ ChatAuth middleware (validateChatAccess, validateFamilyMemberAccess)
✅ Test: idempotency prevents duplicates
✅ Test: unauthorized access returns 403
```

### Day 4: Token Budgeting ✅
```
✅ TokenBudgetService using tiktoken
✅ budgetConversation() - allocate 35% context, 25% history, 40% response
✅ truncateToTokenLimit() - with indicator
✅ truncateHistory() - keep recent messages
✅ Test: 15KB context gets truncated correctly
```

### Day 5: Context Building ✅
```
✅ AIPromptTemplates with smart disclaimer logic
✅ ContextBuilderService foundation
✅ buildVisitContext() - fetch EMR + budget tokens
✅ buildAppointmentContext()
✅ buildGeneralContext()
✅ Test: context stays under token budget
```

### Day 6: Chat Service ✅
```
✅ ChatService foundation
✅ startOrResumeChat() - enforce unique ACTIVE session
✅ sendMessage() - with token budgeting & metadata capture
✅ getSessionMessages() - with pagination
✅ retryLastMessage()
✅ archiveSession(), deleteSession()
✅ Test: duplicate session prevented by unique index
```

### Day 7: Controller ✅
```
✅ Validation schemas (Joi/Zod)
✅ POST /start - with validateFamilyMemberAccess
✅ POST /:sessionId/message - with validateChatAccess
✅ GET /:sessionId/messages - paginated
✅ POST /:sessionId/retry
✅ GET /sessions - list with filters
✅ PATCH /:sessionId - rename
✅ PUT /:sessionId/archive
✅ DELETE /:sessionId
✅ Test: validation returns 422 with field errors
```

### Day 8: Integration ✅
```
✅ PHIRedactor utility (redact names, phones, MRNs)
✅ Register routes in medics-care.js
✅ Add audit events (CHAT_SESSION_STARTED, etc.)
✅ Apply PHI redaction to all logs
✅ Error handling review (correct status codes)
✅ Test: audit trail logs events with PHI redacted
```

### Days 9-10: Testing ✅
```
✅ Security: unauthorized access → 403
✅ Security: wrong familyMemberId → 403
✅ Security: no JWT → 401
✅ Idempotency: same key twice → cached response
✅ Idempotency: no duplicate messages in DB
✅ Token budget: large context truncated
✅ Pagination: 150 messages across 3 pages
✅ Provider retry: 3 retries on 500 error
✅ Context: VISIT loads EMR data
✅ Context: APPOINTMENT loads appointment details
✅ End-to-end: create → send 5 msgs → archive → resume
```

---

## 🔐 Security Checklist (Zero Tolerance)

- [ ] Every endpoint validates JWT token
- [ ] Every session operation checks userId ownership
- [ ] Every family member operation checks ownership
- [ ] Unauthorized access returns 403 (not 404 - don't leak existence)
- [ ] PHI is NEVER logged (use PHIRedactor)
- [ ] Audit trail logs all operations (with PHI redacted)
- [ ] Rate limiting applied (10 msgs/min per user)
- [ ] Idempotency keys required on mutations
- [ ] Input validation on all endpoints (422 on failure)
- [ ] Error messages don't leak sensitive info

---

## 📊 Metadata Tracking (Every Message)

```javascript
// Required metadata in ChatMessage.meta:
{
  provider: 'openai',
  model: 'gpt-4',
  latencyMs: 1250,
  tokens: {
    prompt: 450,
    completion: 180,
    total: 630
  },
  errorCode: null,     // or 'TIMEOUT', 'PROVIDER_ERROR', etc.
  retryCount: 0
}
```

**Why**: Cost tracking, performance monitoring, debugging, audit compliance.

---

## 🎯 Token Budget Allocation

| Component | % of Budget | Typical Tokens | Truncate? |
|-----------|-------------|----------------|-----------|
| System Prompt | Fixed | 200-400 | ❌ No |
| Visit Context | 35% | 1500-2000 | ✅ Yes |
| History | 25% | 1000-1500 | ✅ Yes (recent) |
| User Message | Fixed | 50-200 | ❌ No |
| Response Reserve | 40% | 2000 | N/A |

**Total Budget**: 6000 tokens (for GPT-4 8K context)

---

## 🧪 Must-Pass Tests Before Merge

### Security (3 tests)
1. User A cannot access User B's session → 403
2. User cannot create chat for other's family member → 403
3. No JWT → 401

### Idempotency (2 tests)
1. Same key twice on POST /start → same response, no duplicate
2. Same key twice on POST /message → no duplicate message in DB

### Token Budget (2 tests)
1. 15KB visit context → truncated to ~2000 tokens
2. 30 message history → only recent ~15 included

### Metadata (1 test)
1. Every assistant message has tokens, latency, provider in meta

### Pagination (1 test)
1. 150 messages → paginated correctly with cursor

### Context (3 tests)
1. VISIT chat loads EMR data
2. APPOINTMENT chat loads appointment details
3. GENERAL chat has no patient context

---

## 🚨 Common Pitfalls to Avoid

### ❌ DON'T:
- Export schemas instead of models
- Log patient names, MRNs, or medical details
- Allow duplicate ACTIVE sessions (add unique index!)
- Skip RBAC checks (always validate ownership)
- Return 404 when user lacks permission (use 403)
- Include disclaimer on every AI response (spam)
- Forget to capture tokens/latency metadata
- Store idempotency cache forever (use TTL)
- Send entire 10KB context to AI (truncate smartly)

### ✅ DO:
- Export models: `module.exports = mongoose.model(...)`
- Redact PHI before logging
- Enforce unique ACTIVE session per context
- Validate userId owns familyMemberId
- Return 403 for unauthorized, 404 for not found
- Smart disclaimers (first message + treatment questions)
- Capture metadata on every AI call
- TTL on idempotency cache (24h)
- Token budget: truncate context & history

---

## 📦 Dependencies to Install

```bash
npm install tiktoken      # Token counting for OpenAI models
npm install uuid          # Idempotency key generation
npm install joi           # Request validation (or zod)
npm install axios         # HTTP client for AI providers
```

---

## 🔄 Provider Switching (5-Minute Test)

To verify provider-agnostic design:

```javascript
// 1. Edit src/config/aiConfig.js
activeProvider: 'anthropic',  // Change from 'openai'

// 2. Add Anthropic API key to .env
ANTHROPIC_API_KEY=sk-ant-...

// 3. Restart server
// 4. Send a test message
// 5. Should work with zero code changes
```

---

## 📐 API Error Format (Standard)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "fields": {
      "userId": "Required field",
      "contextType": "Must be one of: VISIT, APPOINTMENT, GENERAL"
    }
  }
}
```

**Status Codes**:
- 400: Bad Request (malformed)
- 401: Unauthorized (no/invalid JWT)
- 403: Forbidden (lack permission)
- 404: Not Found
- 422: Validation Error (with field details)
- 500: Internal Server Error
- 503: Service Unavailable (AI provider down)

---

## 🎯 Definition of Done

A feature is complete when:

- [ ] Code written and follows patterns in guide
- [ ] Model exports model (not schema)
- [ ] Security checks implemented (RBAC)
- [ ] Validation added (422 on error)
- [ ] Metadata captured (tokens, latency)
- [ ] PHI redacted from logs
- [ ] Tests pass (security, idempotency, context)
- [ ] Audit trail events logged
- [ ] Error handling follows standard format
- [ ] Works with real data (not just mocks)
- [ ] Postman collection updated
- [ ] Code reviewed by peer

---

## 📞 Quick Help

**Problem**: Duplicate sessions created
**Fix**: Check unique index exists with `partialFilterExpression: { status: 'ACTIVE' }`

**Problem**: Idempotency not working
**Fix**: Check TTL index on ChatIdempotency, verify key in header

**Problem**: "API key missing" error
**Fix**: Check `.env` has `OPENAI_API_KEY`, verify Factory guards config

**Problem**: Context too large, API error
**Fix**: Implement TokenBudgetService, truncate context to 2000 tokens

**Problem**: User can access other's chats
**Fix**: Apply `validateChatAccess` middleware to all session endpoints

**Problem**: PHI in logs
**Fix**: Use PHIRedactor on all console.log/winston calls

---

## 📚 Reference Documents

- **Comprehensive Guide**: `AI_CHAT_SYSTEM_DEVELOPMENT_GUIDE_V2.md`
- **API Standards**: `API_RESPONSE_FORMAT.md`
- **This Checklist**: `AI_CHAT_IMPLEMENTATION_CHECKLIST.md`

---

**Version**: 2.0
**Last Updated**: 2025-01-08
**Use this for**: Daily standup tracking, PR reviews, final sign-off
