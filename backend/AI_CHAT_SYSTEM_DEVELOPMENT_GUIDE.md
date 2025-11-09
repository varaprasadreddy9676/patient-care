# AI Chat System - Comprehensive Development Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [File Structure](#file-structure)
6. [Implementation Checklist](#implementation-checklist)
7. [Code Specifications](#code-specifications)
8. [Testing Checklist](#testing-checklist)
9. [Configuration](#configuration)
10. [Frontend Integration](#frontend-integration)

---

## Overview

### Goal
Build a provider-agnostic AI chat system that allows users to:
- Chat about specific medical visits with full context (EMR data, lab reports, prescriptions)
- Chat about upcoming appointments
- Ask general health questions
- Resume previous conversations from history

### Key Principles
- **Provider Agnostic**: Easy to switch between OpenAI, Claude, Gemini, etc.
- **Context Aware**: Automatically loads relevant medical data for visits/appointments
- **Simple MVP**: No token tracking or cost management for initial version
- **Persistent History**: All chats saved in MongoDB and can be resumed
- **Extensible**: Easy to add new context types or providers

---

## Architecture

### High-Level Flow

```
User Action (UI)
    ↓
Frontend calls /api/v1/chat/start
    ↓
ChatController → ChatService
    ↓
Check if session exists for context
    ↓
If new: Create session + build context
If existing: Load session + messages
    ↓
ContextBuilderService fetches relevant data
    ↓
Return session + messages to frontend
    ↓
User sends message
    ↓
ChatService.sendMessage()
    ↓
Load conversation history from DB
    ↓
AIProviderFactory → ActiveProvider (OpenAI/Claude/etc)
    ↓
Send to AI API with context + history
    ↓
Save user message + AI response to DB
    ↓
Return response to frontend
```

### Provider Architecture (Adapter Pattern)

```
AIProviderInterface (Abstract)
    ↓
    ├── OpenAIProvider
    ├── AnthropicProvider
    ├── GeminiProvider
    └── (Future providers)

AIProviderFactory
    ↓
Returns active provider based on config
```

---

## Database Schema

### Collection 1: `chat_sessions`

```javascript
{
  _id: ObjectId,
  userId: ObjectId,               // Required - User who owns the chat
  familyMemberId: ObjectId,       // Required - Which family member is this about

  // Generic Context System
  contextType: String,            // Required - 'VISIT', 'APPOINTMENT', 'PRESCRIPTION', 'GENERAL'
  contextId: String,              // Optional - visitId, appointmentId, etc. (null for GENERAL)

  // Flexible context storage
  contextData: {                  // Mixed - Store any context-specific data
    type: Mixed,
    default: {}
  },

  // Chat Metadata
  title: String,                  // Auto-generated title (e.g., "Chat about Visit on 12-Jan-2025")
  status: String,                 // 'ACTIVE', 'ARCHIVED'

  // Statistics
  messageCount: Number,           // Total messages in this session
  lastMessageAt: Date,            // Last activity timestamp

  // Timestamps
  createdAt: Date,
  updatedAt: Date,

  // Soft delete
  active: Boolean                 // Default: true
}

// Indexes
- { userId: 1, active: 1 }
- { contextType: 1, contextId: 1 }
- { userId: 1, familyMemberId: 1, contextType: 1, contextId: 1 } // Unique session finder
```

### Collection 2: `chat_messages`

```javascript
{
  _id: ObjectId,
  sessionId: ObjectId,            // Required - Reference to chat_sessions

  role: String,                   // Required - 'user', 'assistant', 'system'
  content: String,                // Required - Message text

  // Timestamps
  createdAt: Date,

  // Soft delete
  active: Boolean                 // Default: true
}

// Indexes
- { sessionId: 1, createdAt: 1 }
- { sessionId: 1, active: 1 }
```

---

## API Endpoints

### Base Route: `/api/v1/chat`

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| POST | `/start` | Start or resume chat | See below | Session + messages |
| POST | `/:sessionId/message` | Send message to chat | `{ message: string }` | User + AI messages |
| GET | `/:sessionId` | Get chat by ID | - | Session + messages |
| GET | `/sessions` | List all user chats | Query params | Array of sessions |
| PUT | `/:sessionId/archive` | Archive chat | - | Success response |
| DELETE | `/:sessionId` | Delete chat | - | Success response |

### Detailed Endpoint Specifications

#### 1. POST `/api/v1/chat/start`

**Purpose**: Start a new chat or resume existing one based on context

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

**Context Type Examples**:
- `VISIT`: Chat about a specific visit
  - `contextId`: visitId
  - `contextData`: { hospitalCode, patientId }

- `APPOINTMENT`: Chat about an appointment
  - `contextId`: appointmentId (MongoDB _id)
  - `contextData`: {}

- `GENERAL`: General health questions
  - `contextId`: null
  - `contextData`: {}

**Response**:
```json
{
  "success": true,
  "data": {
    "session": {
      "_id": "507f1f77bcf86cd799439013",
      "title": "Chat about Visit on 12-Jan-2025",
      "contextType": "VISIT",
      "messageCount": 5,
      "lastMessageAt": "2025-01-12T10:30:00Z",
      "createdAt": "2025-01-12T09:00:00Z"
    },
    "messages": [
      {
        "_id": "...",
        "role": "system",
        "content": "Context loaded...",
        "createdAt": "2025-01-12T09:00:00Z"
      },
      {
        "_id": "...",
        "role": "user",
        "content": "What do my lab results mean?",
        "createdAt": "2025-01-12T09:01:00Z"
      },
      {
        "_id": "...",
        "role": "assistant",
        "content": "Based on your lab results...",
        "createdAt": "2025-01-12T09:01:15Z"
      }
    ]
  }
}
```

#### 2. POST `/api/v1/chat/:sessionId/message`

**Purpose**: Send a message to an existing chat session

**Request Body**:
```json
{
  "message": "What medications should I take?"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "userMessage": {
      "_id": "...",
      "role": "user",
      "content": "What medications should I take?",
      "createdAt": "2025-01-12T10:30:00Z"
    },
    "assistantMessage": {
      "_id": "...",
      "role": "assistant",
      "content": "According to your prescription...",
      "createdAt": "2025-01-12T10:30:15Z"
    }
  }
}
```

#### 3. GET `/api/v1/chat/:sessionId`

**Purpose**: Get full chat session with all messages

**Response**:
```json
{
  "success": true,
  "data": {
    "session": { ... },
    "messages": [ ... ]
  }
}
```

#### 4. GET `/api/v1/chat/sessions`

**Purpose**: List all chat sessions for a user

**Query Parameters**:
- `userId` (required)
- `familyMemberId` (optional)
- `contextType` (optional)
- `status` (optional) - 'ACTIVE' or 'ARCHIVED'

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Chat about Visit on 12-Jan-2025",
      "contextType": "VISIT",
      "messageCount": 8,
      "lastMessageAt": "2025-01-12T10:30:00Z",
      "status": "ACTIVE"
    },
    {
      "_id": "...",
      "title": "Appointment Questions",
      "contextType": "APPOINTMENT",
      "messageCount": 3,
      "lastMessageAt": "2025-01-11T15:20:00Z",
      "status": "ACTIVE"
    }
  ]
}
```

#### 5. PUT `/api/v1/chat/:sessionId/archive`

**Purpose**: Archive a chat session (soft delete)

**Response**:
```json
{
  "success": true,
  "message": "Chat session archived successfully"
}
```

#### 6. DELETE `/api/v1/chat/:sessionId`

**Purpose**: Permanently delete a chat session and all messages

**Response**:
```json
{
  "success": true,
  "message": "Chat session deleted successfully"
}
```

---

## File Structure

```
medics-care-app-server/
│
├── src/
│   ├── models/
│   │   ├── ChatSession.js              ✨ NEW
│   │   └── ChatMessage.js              ✨ NEW
│   │
│   ├── controllers/
│   │   └── ChatController.js           ✨ NEW
│   │
│   ├── services/
│   │   ├── ai/
│   │   │   ├── AIProviderInterface.js  ✨ NEW
│   │   │   ├── AIProviderFactory.js    ✨ NEW
│   │   │   └── providers/
│   │   │       ├── OpenAIProvider.js   ✨ NEW
│   │   │       ├── AnthropicProvider.js ✨ NEW (Future)
│   │   │       └── GeminiProvider.js   ✨ NEW (Future)
│   │   │
│   │   ├── ChatService.js              ✨ NEW
│   │   └── ContextBuilderService.js    ✨ NEW
│   │
│   ├── config/
│   │   └── aiConfig.js                 ✨ NEW
│   │
│   └── utils/
│       └── AIPromptTemplates.js        ✨ NEW
│
├── .env                                (Add AI API keys)
└── AI_CHAT_SYSTEM_DEVELOPMENT_GUIDE.md ✅ THIS FILE
```

---

## Implementation Checklist

### ✅ Phase 1: Database Models (Day 1)

#### Task 1.1: Create ChatSession Model
- [ ] Create `src/models/ChatSession.js`
- [ ] Define schema with all fields
- [ ] Add indexes for performance
- [ ] Add validation rules
- [ ] Export schema
- [ ] Test model creation in MongoDB

#### Task 1.2: Create ChatMessage Model
- [ ] Create `src/models/ChatMessage.js`
- [ ] Define schema with all fields
- [ ] Add indexes for sessionId
- [ ] Add validation rules
- [ ] Export schema
- [ ] Test model creation in MongoDB

#### Task 1.3: Register Models
- [ ] Add ChatSession to `src/models/index.js`
- [ ] Add ChatMessage to `src/models/index.js`
- [ ] Verify models load on server start

---

### ✅ Phase 2: AI Provider System (Day 2)

#### Task 2.1: Create Provider Interface
- [ ] Create `src/services/ai/AIProviderInterface.js`
- [ ] Define base class with `chat()` method
- [ ] Add error handling structure
- [ ] Document interface requirements

#### Task 2.2: Create OpenAI Provider
- [ ] Create `src/services/ai/providers/OpenAIProvider.js`
- [ ] Implement `chat(messages, options)` method
- [ ] Add API call to OpenAI
- [ ] Handle response parsing
- [ ] Add error handling and retries
- [ ] Test with sample messages

#### Task 2.3: Create Provider Factory
- [ ] Create `src/services/ai/AIProviderFactory.js`
- [ ] Implement factory pattern
- [ ] Add provider selection logic
- [ ] Handle unknown provider errors
- [ ] Test provider creation

#### Task 2.4: Create AI Configuration
- [ ] Create `src/config/aiConfig.js`
- [ ] Define provider configurations
- [ ] Add environment variable references
- [ ] Document configuration options
- [ ] Update `.env` with API keys

---

### ✅ Phase 3: Context Building (Days 3-4)

#### Task 3.1: Create Prompt Templates
- [ ] Create `src/utils/AIPromptTemplates.js`
- [ ] Define system prompt for VISIT context
- [ ] Define system prompt for APPOINTMENT context
- [ ] Define system prompt for GENERAL context
- [ ] Add medical disclaimer templates
- [ ] Add safety guidelines to prompts

#### Task 3.2: Create Context Builder Service
- [ ] Create `src/services/ContextBuilderService.js`
- [ ] Implement `buildContext(contextType, contextId, data)` main method
- [ ] Implement context routing logic

#### Task 3.3: Build Visit Context
- [ ] Implement `buildVisitContext(visitId, data)` method
- [ ] Integrate with HTTPService to fetch EMR data
- [ ] Fetch lab reports for visit
- [ ] Fetch prescriptions for visit
- [ ] Fetch radiology reports
- [ ] Fetch discharge summary
- [ ] Format data into readable context text
- [ ] Generate visit-specific system prompt
- [ ] Return formatted context object
- [ ] Test with real visit data

#### Task 3.4: Build Appointment Context
- [ ] Implement `buildAppointmentContext(appointmentId)` method
- [ ] Fetch appointment from MongoDB
- [ ] Extract relevant appointment details
- [ ] Format appointment information
- [ ] Generate appointment-specific system prompt
- [ ] Return formatted context object
- [ ] Test with real appointment data

#### Task 3.5: Build General Context
- [ ] Implement `buildGeneralContext(userData)` method
- [ ] Create general health assistant prompt
- [ ] Add safety disclaimers
- [ ] Return minimal context object

#### Task 3.6: Helper Methods
- [ ] Implement `formatLabReports(reports)` method
- [ ] Implement `formatPrescriptions(prescriptions)` method
- [ ] Implement `formatRadiologyReports(reports)` method
- [ ] Add utility functions for data formatting

---

### ✅ Phase 4: Chat Service (Day 5)

#### Task 4.1: Create Chat Service
- [ ] Create `src/services/ChatService.js`
- [ ] Import required models and services
- [ ] Initialize dependencies

#### Task 4.2: Start/Resume Chat Logic
- [ ] Implement `startOrResumeChat(params)` method
- [ ] Check if session exists for context
- [ ] If exists: Load session and messages
- [ ] If new: Create new session
- [ ] Build context using ContextBuilderService
- [ ] Generate chat title
- [ ] Save system message with context
- [ ] Return session + messages

#### Task 4.3: Send Message Logic
- [ ] Implement `sendMessage(sessionId, userMessage)` method
- [ ] Validate session exists
- [ ] Save user message to database
- [ ] Load conversation history (last 20 messages)
- [ ] Format messages for AI provider
- [ ] Call AI provider with conversation
- [ ] Parse AI response
- [ ] Save assistant message to database
- [ ] Update session metadata (messageCount, lastMessageAt)
- [ ] Return both messages

#### Task 4.4: History Management
- [ ] Implement `getSessionHistory(sessionId)` method
- [ ] Load session details
- [ ] Load all messages ordered by createdAt
- [ ] Return formatted data

#### Task 4.5: Session Management
- [ ] Implement `getUserSessions(userId, filters)` method
- [ ] Implement `archiveSession(sessionId)` method
- [ ] Implement `deleteSession(sessionId)` method
- [ ] Add proper error handling

---

### ✅ Phase 5: Chat Controller (Day 6)

#### Task 5.1: Create Controller
- [ ] Create `src/controllers/ChatController.js`
- [ ] Import ChatService, ResponseHandler, ErrorCodes
- [ ] Set up module exports with app and route

#### Task 5.2: POST /start Endpoint
- [ ] Create endpoint handler
- [ ] Validate request body
- [ ] Extract userId, familyMemberId, contextType, contextId, contextData
- [ ] Call ChatService.startOrResumeChat()
- [ ] Handle errors with ResponseHandler
- [ ] Return success response
- [ ] Test with Postman/curl

#### Task 5.3: POST /:sessionId/message Endpoint
- [ ] Create endpoint handler
- [ ] Validate sessionId parameter
- [ ] Validate message in body
- [ ] Call ChatService.sendMessage()
- [ ] Handle errors
- [ ] Return success response
- [ ] Test with Postman/curl

#### Task 5.4: GET /:sessionId Endpoint
- [ ] Create endpoint handler
- [ ] Validate sessionId
- [ ] Call ChatService.getSessionHistory()
- [ ] Handle errors
- [ ] Return success response
- [ ] Test with Postman/curl

#### Task 5.5: GET /sessions Endpoint
- [ ] Create endpoint handler
- [ ] Extract query parameters (userId, familyMemberId, contextType, status)
- [ ] Validate required params
- [ ] Call ChatService.getUserSessions()
- [ ] Handle errors
- [ ] Return success response
- [ ] Test with Postman/curl

#### Task 5.6: PUT /:sessionId/archive Endpoint
- [ ] Create endpoint handler
- [ ] Validate sessionId
- [ ] Call ChatService.archiveSession()
- [ ] Handle errors
- [ ] Return success response
- [ ] Test with Postman/curl

#### Task 5.7: DELETE /:sessionId Endpoint
- [ ] Create endpoint handler
- [ ] Validate sessionId
- [ ] Call ChatService.deleteSession()
- [ ] Handle errors
- [ ] Return success response
- [ ] Test with Postman/curl

---

### ✅ Phase 6: Route Integration (Day 7)

#### Task 6.1: Register Routes
- [ ] Find main routes file (likely `medics-care.js` or routes config)
- [ ] Import ChatController
- [ ] Register route: `ChatController(app, '/api/v1/chat')`
- [ ] Test route registration

#### Task 6.2: Add Audit Trail Integration
- [ ] Add auditTrailService logging to chat start
- [ ] Add logging to message send
- [ ] Add logging to session operations
- [ ] Define audit event types for chat operations

---

### ✅ Phase 7: Testing & Validation (Day 8)

#### Task 7.1: Unit Testing
- [ ] Test ChatSession model CRUD operations
- [ ] Test ChatMessage model CRUD operations
- [ ] Test AIProviderFactory with different providers
- [ ] Test OpenAIProvider chat method
- [ ] Test ContextBuilderService for each context type

#### Task 7.2: Integration Testing - Visit Context
- [ ] Create chat session with VISIT context
- [ ] Verify EMR data is fetched correctly
- [ ] Verify lab reports are included in context
- [ ] Send message and verify AI response
- [ ] Resume chat and verify history loads
- [ ] Test with multiple visits

#### Task 7.3: Integration Testing - Appointment Context
- [ ] Create chat session with APPOINTMENT context
- [ ] Verify appointment data is fetched
- [ ] Send message about appointment
- [ ] Verify AI response is appropriate
- [ ] Resume appointment chat

#### Task 7.4: Integration Testing - General Context
- [ ] Create general chat session
- [ ] Send health-related questions
- [ ] Verify responses have disclaimers
- [ ] Test multiple conversation turns

#### Task 7.5: End-to-End Testing
- [ ] Test complete flow: Visit chat → Send 5 messages → Archive → Resume
- [ ] Test session listing for user with multiple chats
- [ ] Test deletion of chat session
- [ ] Test error scenarios (invalid IDs, missing data)

#### Task 7.6: Provider Switching Test
- [ ] Switch provider in aiConfig.js
- [ ] Test chat with new provider
- [ ] Verify responses work correctly
- [ ] Switch back to OpenAI

---

## Code Specifications

### 1. ChatSession Model (`src/models/ChatSession.js`)

```javascript
const mongoose = require('mongoose');

const ChatSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },

    familyMemberId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'family_member'
    },

    // Generic context system
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

    // Chat metadata
    title: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ['ACTIVE', 'ARCHIVED'],
        default: 'ACTIVE'
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

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    },

    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for performance
ChatSessionSchema.index({ userId: 1, active: 1 });
ChatSessionSchema.index({ userId: 1, familyMemberId: 1, contextType: 1, contextId: 1 });

module.exports = ChatSessionSchema;
```

### 2. ChatMessage Model (`src/models/ChatMessage.js`)

```javascript
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
        enum: ['user', 'assistant', 'system']
    },

    content: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    active: {
        type: Boolean,
        default: true
    }
});

// Indexes
ChatMessageSchema.index({ sessionId: 1, createdAt: 1 });
ChatMessageSchema.index({ sessionId: 1, active: 1 });

module.exports = ChatMessageSchema;
```

### 3. AI Provider Interface (`src/services/ai/AIProviderInterface.js`)

```javascript
/**
 * Base interface for AI providers
 * All AI providers must extend this class and implement the chat method
 */
class AIProviderInterface {
    /**
     * Send a chat request to the AI provider
     * @param {Array} messages - Array of message objects with role and content
     * @param {Object} options - Provider-specific options
     * @returns {Promise<string>} - AI response text
     */
    async chat(messages, options = {}) {
        throw new Error('chat() method must be implemented by provider');
    }

    /**
     * Get provider name
     * @returns {string}
     */
    getName() {
        return this.constructor.name;
    }
}

module.exports = AIProviderInterface;
```

### 4. OpenAI Provider (`src/services/ai/providers/OpenAIProvider.js`)

```javascript
const AIProviderInterface = require('../AIProviderInterface');
const axios = require('axios');

class OpenAIProvider extends AIProviderInterface {
    constructor(apiKey, defaultModel = 'gpt-4') {
        super();
        this.apiKey = apiKey;
        this.defaultModel = defaultModel;
        this.baseURL = 'https://api.openai.com/v1';
    }

    async chat(messages, options = {}) {
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
                    timeout: 30000 // 30 second timeout
                }
            );

            if (response.data && response.data.choices && response.data.choices.length > 0) {
                return response.data.choices[0].message.content;
            }

            throw new Error('Invalid response from OpenAI');

        } catch (error) {
            console.error('OpenAI Provider Error:', error.message);

            if (error.response) {
                throw new Error(`OpenAI API Error: ${error.response.data.error?.message || error.message}`);
            }

            throw new Error(`OpenAI Request Failed: ${error.message}`);
        }
    }
}

module.exports = OpenAIProvider;
```

### 5. AI Provider Factory (`src/services/ai/AIProviderFactory.js`)

```javascript
const OpenAIProvider = require('./providers/OpenAIProvider');
// Import other providers as they are added
// const AnthropicProvider = require('./providers/AnthropicProvider');
// const GeminiProvider = require('./providers/GeminiProvider');

class AIProviderFactory {
    /**
     * Create AI provider instance based on configuration
     * @param {string} providerName - Name of the provider ('openai', 'anthropic', etc.)
     * @param {Object} config - Provider configuration
     * @returns {AIProviderInterface} Provider instance
     */
    static create(providerName, config) {
        switch (providerName.toLowerCase()) {
            case 'openai':
                return new OpenAIProvider(config.apiKey, config.model);

            // Future providers
            // case 'anthropic':
            //     return new AnthropicProvider(config.apiKey, config.model);

            // case 'gemini':
            //     return new GeminiProvider(config.apiKey, config.model);

            default:
                throw new Error(`Unknown AI provider: ${providerName}`);
        }
    }
}

module.exports = AIProviderFactory;
```

### 6. AI Configuration (`src/config/aiConfig.js`)

```javascript
module.exports = {
    // Active provider - change this to switch providers
    activeProvider: 'openai',

    // Provider configurations
    providers: {
        openai: {
            apiKey: process.env.OPENAI_API_KEY || '',
            model: 'gpt-4',
            options: {
                temperature: 0.7,
                maxTokens: 1500
            }
        },

        // Future providers can be added here
        anthropic: {
            apiKey: process.env.ANTHROPIC_API_KEY || '',
            model: 'claude-3-sonnet-20240229',
            options: {
                maxTokens: 1500
            }
        },

        gemini: {
            apiKey: process.env.GEMINI_API_KEY || '',
            model: 'gemini-pro',
            options: {}
        }
    },

    // General settings
    settings: {
        maxHistoryMessages: 20,      // Number of previous messages to include in context
        systemMessageIncluded: true, // Include system message in conversation
        autoTitle: true              // Auto-generate chat titles
    }
};
```

### 7. Prompt Templates (`src/utils/AIPromptTemplates.js`)

```javascript
const MEDICAL_DISCLAIMER = "⚠️ IMPORTANT: This is general information only. Please consult your doctor for medical advice, diagnosis, or treatment.";

const PROMPTS = {
    VISIT: {
        system: `You are a helpful medical assistant helping patients understand their visit records and medical reports.

IMPORTANT GUIDELINES:
- Explain medical terms in simple, patient-friendly language
- Reference specific test results, prescriptions, and findings when answering
- Do NOT diagnose or provide medical treatment advice
- Do NOT recommend medications or dosage changes
- Be empathetic and supportive
- If asked about serious/concerning symptoms, recommend seeing a doctor immediately
- Always include the medical disclaimer in your responses

Answer questions accurately based on the visit information provided below.`,

        disclaimer: MEDICAL_DISCLAIMER
    },

    APPOINTMENT: {
        system: `You are a helpful assistant helping patients prepare for their upcoming appointments.

IMPORTANT GUIDELINES:
- Help them understand appointment details and prepare questions
- Suggest what documents or information to bring
- Explain what to expect during the appointment
- Do NOT provide medical diagnosis or treatment advice
- Always recommend discussing medical concerns directly with the doctor
- Be supportive and reduce appointment anxiety
- Always include the medical disclaimer

Answer questions about the appointment.`,

        disclaimer: MEDICAL_DISCLAIMER
    },

    GENERAL: {
        system: `You are a helpful health assistant providing general health and wellness information.

IMPORTANT GUIDELINES:
- Provide general health and wellness information only
- Do NOT diagnose conditions or provide specific medical treatment advice
- Do NOT recommend specific medications or treatments
- Always recommend consulting a healthcare provider for medical concerns
- For serious symptoms, strongly recommend seeing a doctor immediately
- Be supportive and informative
- Always include the medical disclaimer

Provide helpful, general health information.`,

        disclaimer: MEDICAL_DISCLAIMER
    },

    PRESCRIPTION: {
        system: `You are a helpful assistant explaining prescription medications to patients.

IMPORTANT GUIDELINES:
- Explain what the medications are for in simple terms
- Explain how to take medications properly
- Do NOT recommend changes to dosages or medications
- Do NOT suggest stopping or starting medications
- Always recommend consulting the prescribing doctor for changes
- Mention to check with pharmacist for drug interactions
- Always include the medical disclaimer

Answer questions about the prescribed medications.`,

        disclaimer: MEDICAL_DISCLAIMER
    }
};

module.exports = {
    getSystemPrompt: (contextType) => {
        return PROMPTS[contextType]?.system || PROMPTS.GENERAL.system;
    },

    getDisclaimer: (contextType) => {
        return PROMPTS[contextType]?.disclaimer || MEDICAL_DISCLAIMER;
    },

    formatContextMessage: (contextType, contextText) => {
        return `${PROMPTS[contextType]?.system}\n\n${contextText}`;
    },

    MEDICAL_DISCLAIMER
};
```

---

## Testing Checklist

### Manual Testing Scenarios

#### Scenario 1: Visit-Based Chat
- [ ] Get a valid visitId, hospitalCode, patientId from database
- [ ] Call POST /api/v1/chat/start with VISIT context
- [ ] Verify response contains session and context
- [ ] Verify EMR data, lab reports, prescriptions are loaded
- [ ] Send message: "What do my lab results mean?"
- [ ] Verify AI response references specific lab values
- [ ] Send follow-up: "Should I be worried about any values?"
- [ ] Close and reopen - verify history persists

#### Scenario 2: Appointment Chat
- [ ] Get a valid appointmentId from database
- [ ] Call POST /api/v1/chat/start with APPOINTMENT context
- [ ] Verify appointment details are in context
- [ ] Send message: "What should I prepare for my appointment?"
- [ ] Verify helpful response
- [ ] Send: "What questions should I ask my doctor?"
- [ ] Verify appropriate suggestions

#### Scenario 3: General Health Chat
- [ ] Call POST /api/v1/chat/start with GENERAL context (no contextId)
- [ ] Send message: "What are symptoms of diabetes?"
- [ ] Verify general information provided
- [ ] Verify medical disclaimer is included
- [ ] Send: "I have a headache, what should I do?"
- [ ] Verify recommendation to see doctor for persistent symptoms

#### Scenario 4: Session Management
- [ ] Create 3 different chat sessions (1 visit, 1 appointment, 1 general)
- [ ] Call GET /api/v1/chat/sessions with userId
- [ ] Verify all 3 sessions are returned
- [ ] Archive one session
- [ ] Verify it shows as ARCHIVED
- [ ] Delete one session
- [ ] Verify it's removed from list

#### Scenario 5: Error Handling
- [ ] Call /start with invalid userId - verify error
- [ ] Call /start with invalid visitId - verify graceful handling
- [ ] Send message to non-existent sessionId - verify error
- [ ] Test with invalid/expired API key - verify error message

---

## Configuration

### Environment Variables

Add to `.env` file:

```bash
# AI Provider API Keys
OPENAI_API_KEY=sk-your-openai-api-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
GEMINI_API_KEY=your-gemini-api-key-here

# AI Configuration
AI_PROVIDER=openai
AI_MODEL=gpt-4
```

### Switching Providers

To switch from OpenAI to another provider:

1. Update `src/config/aiConfig.js`:
```javascript
activeProvider: 'anthropic',  // Changed from 'openai'
```

2. Ensure API key is set in `.env`
3. Restart server
4. Test chat - should work with new provider

---

## Frontend Integration

### Example: Visit Chat Integration

```javascript
// In Visit Detail Screen

// 1. User clicks "Chat about this visit" button
async function openVisitChat(visit) {
    try {
        const response = await fetch('/api/v1/chat/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
                userId: currentUser._id,
                familyMemberId: visit.familyMemberId,
                contextType: 'VISIT',
                contextId: visit.visitId.toString(),
                contextData: {
                    hospitalCode: visit.hospitalCode,
                    patientId: visit.patientId
                }
            })
        });

        const result = await response.json();

        if (result.success) {
            // Open chat UI with session and messages
            openChatInterface({
                session: result.data.session,
                messages: result.data.messages,
                contextInfo: {
                    type: 'Visit',
                    date: visit.visitDate,
                    doctor: visit.doctorName
                }
            });
        }

    } catch (error) {
        console.error('Failed to start chat:', error);
    }
}

// 2. Sending a message
async function sendChatMessage(sessionId, messageText) {
    try {
        const response = await fetch(`/api/v1/chat/${sessionId}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
                message: messageText
            })
        });

        const result = await response.json();

        if (result.success) {
            // Add user message to UI
            addMessageToUI(result.data.userMessage);

            // Add AI response to UI
            addMessageToUI(result.data.assistantMessage);
        }

    } catch (error) {
        console.error('Failed to send message:', error);
    }
}

// 3. Loading chat history
async function loadPreviousChats(userId) {
    try {
        const response = await fetch(`/api/v1/chat/sessions?userId=${userId}`, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });

        const result = await response.json();

        if (result.success) {
            // Display list of previous chats
            displayChatList(result.data);
        }

    } catch (error) {
        console.error('Failed to load chats:', error);
    }
}
```

### UI Components Needed

1. **Chat List Screen**
   - Show all user's chats
   - Filter by context type
   - Show last message preview
   - Click to resume chat

2. **Chat Interface**
   - Header showing context (Visit Date, Doctor, etc.)
   - Message list (scrollable)
   - Input box for new messages
   - Send button
   - Archive/Delete options

3. **Context Badge**
   - Visual indicator of chat type (Visit/Appointment/General)
   - Color-coded badges

---

## Production Considerations

### Security
- [ ] Add rate limiting to chat endpoints
- [ ] Validate all user inputs
- [ ] Sanitize messages before storing
- [ ] Implement user authentication on all endpoints
- [ ] Add CORS restrictions

### Performance
- [ ] Add Redis caching for frequently asked questions
- [ ] Implement pagination for message history
- [ ] Add database indexes (already in schema)
- [ ] Consider message archival strategy for old chats

### Monitoring
- [ ] Log all AI API calls
- [ ] Track AI response times
- [ ] Monitor error rates
- [ ] Set up alerts for API failures

### Compliance
- [ ] Ensure HIPAA compliance for medical data
- [ ] Add data retention policy
- [ ] Implement audit trail for all chats
- [ ] Add user consent for AI chat

---

## Troubleshooting Guide

### Common Issues

#### Issue: "OpenAI API Error: Invalid API Key"
**Solution**:
- Check `.env` file has correct `OPENAI_API_KEY`
- Verify API key is active in OpenAI dashboard
- Restart server after updating .env

#### Issue: Context not loading for visit
**Solution**:
- Verify visitId, hospitalCode, patientId are correct
- Check HTTPService is configured properly
- Check hospital API is accessible
- Add logging to ContextBuilderService to debug

#### Issue: Messages not saving to database
**Solution**:
- Check MongoDB connection
- Verify ChatMessage model is registered
- Check for validation errors in console
- Verify sessionId is valid ObjectId

#### Issue: Chat history showing wrong messages
**Solution**:
- Check sessionId is correctly passed
- Verify query includes `active: true` filter
- Check message ordering by createdAt

---

## Next Steps / Future Enhancements

### Phase 2 Features
- [ ] Voice input for messages
- [ ] Multi-language support
- [ ] Export chat as PDF
- [ ] Share chat with doctor
- [ ] Smart suggestions based on context
- [ ] Medication interaction checker
- [ ] Symptom severity assessment

### Advanced Features
- [ ] Real-time streaming responses (SSE)
- [ ] Token usage tracking and limits
- [ ] Cost management dashboard
- [ ] A/B testing different prompts
- [ ] User feedback on AI responses
- [ ] Chat analytics and insights

---

## Support & Documentation

### Key Files to Reference
- Response format: `API_RESPONSE_FORMAT.md`
- Error codes: `src/utils/ErrorCodes.js`
- Response handler: `src/utils/ResponseHandler.js`
- HTTP service: `src/services/HTTPService.js`

### Getting Help
- Check existing controllers for patterns
- Reference `AppointmentController.js` for complex flows
- Reference `VisitController.js` for EMR data fetching
- Use existing services as templates

---

## Development Progress Tracker

### Overall Progress

**Phase 1: Database Models** ⬜ Not Started | ◐ In Progress | ✅ Complete
- ChatSession Model: ⬜
- ChatMessage Model: ⬜
- Model Registration: ⬜

**Phase 2: AI Provider System** ⬜
- Provider Interface: ⬜
- OpenAI Provider: ⬜
- Provider Factory: ⬜
- AI Configuration: ⬜

**Phase 3: Context Building** ⬜
- Prompt Templates: ⬜
- Context Builder Service: ⬜
- Visit Context: ⬜
- Appointment Context: ⬜
- General Context: ⬜

**Phase 4: Chat Service** ⬜
- Start/Resume Logic: ⬜
- Send Message Logic: ⬜
- History Management: ⬜
- Session Management: ⬜

**Phase 5: Chat Controller** ⬜
- POST /start: ⬜
- POST /:sessionId/message: ⬜
- GET /:sessionId: ⬜
- GET /sessions: ⬜
- PUT /:sessionId/archive: ⬜
- DELETE /:sessionId: ⬜

**Phase 6: Route Integration** ⬜
- Route Registration: ⬜
- Audit Trail Integration: ⬜

**Phase 7: Testing** ⬜
- Unit Tests: ⬜
- Integration Tests: ⬜
- End-to-End Tests: ⬜

---

## Sign-Off Checklist

Before marking as complete:
- [ ] All models created and tested
- [ ] All endpoints working and tested
- [ ] Documentation updated
- [ ] Environment variables documented
- [ ] Error handling implemented
- [ ] Audit trail integrated
- [ ] Code reviewed
- [ ] Frontend integration guide provided
- [ ] Production considerations addressed
- [ ] Troubleshooting guide complete

---

**Document Version**: 1.0
**Last Updated**: 2025-01-08
**Author**: Development Team
**Status**: Ready for Implementation
