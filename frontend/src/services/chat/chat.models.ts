/**
 * AI Chat System Models
 * Type definitions for the chat API
 */

// Context Types
export type ChatContextType = 'VISIT' | 'APPOINTMENT' | 'PRESCRIPTION' | 'LAB_REPORT' | 'GENERAL';

// Session Status
export type ChatSessionStatus = 'ACTIVE' | 'ARCHIVED';

// Message Roles
export type MessageRole = 'system' | 'user' | 'assistant';

// Chat Session
export interface ChatSession {
  _id: string;
  userId: string;
  familyMemberId: string;
  contextType: ChatContextType;
  contextId: string | null;
  title: string;
  status: ChatSessionStatus;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

// Chat Message
export interface ChatMessage {
  _id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  meta?: {
    provider?: string;
    model?: string;
    latencyMs?: number;
    tokens?: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
  createdAt: string;
}

// Pagination
export interface Pagination {
  total: number;
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}

// Messages Response
export interface MessagesResponse {
  items: ChatMessage[];
  pagination: Pagination;
}

// Start Chat Request
export interface StartChatRequest {
  userId: string;
  familyMemberId: string;
  contextType: ChatContextType;
  contextId?: string | null;
  contextData?: {
    hospitalCode?: string;
    patientId?: string;
    [key: string]: any;
  };
}

// Start Chat Response
export interface StartChatResponse {
  session: ChatSession;
  messages: MessagesResponse;
  isNew: boolean;
}

// Send Message Response
export interface SendMessageResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  tokenUsage?: {
    system: number;
    context: number;
    history: number;
    userMessage: number;
    total: number;
    budget: number;
    remaining: number;
  };
}

// Update Session Request
export interface UpdateSessionRequest {
  title: string;
}

// List Sessions Query
export interface ListSessionsQuery {
  familyMemberId?: string;
  contextType?: ChatContextType;
  status?: ChatSessionStatus;
}

// UI Helper - Message with loading state
export interface ChatMessageUI extends ChatMessage {
  isPending?: boolean;
  hasError?: boolean;
}
