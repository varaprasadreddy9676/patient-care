import { Injectable } from '@angular/core';
import { HttpService } from '../http/http.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { StorageService } from '../storage/storage.service';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import {
  ChatSession,
  ChatMessage,
  MessagesResponse,
  StartChatRequest,
  StartChatResponse,
  SendMessageResponse,
  UpdateSessionRequest,
  ListSessionsQuery,
  ChatContextType
} from './chat.models';

/**
 * AI Chat Service
 * Handles all chat-related API calls with idempotency support
 */
@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private readonly chatBaseUrl = environment.BASE_URL + '/api/v1/chat';

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private router: Router
  ) {}

  /**
   * Generate a UUID v4 for idempotency keys
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get authorization headers with optional idempotency key
   */
  private getHeaders(withIdempotency: boolean = false): HttpHeaders {
    const user: any = this.storageService.get('user');
    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (user ? user.token : '')
    };

    if (withIdempotency) {
      headers['Idempotency-Key'] = this.generateUUID();
    }

    return new HttpHeaders(headers);
  }

  /**
   * Start a new chat or resume an existing one
   */
  async startChat(request: StartChatRequest): Promise<StartChatResponse> {
    // Log the request for debugging
    console.log('[ChatService] Starting chat with request:', {
      contextType: request.contextType,
      contextId: request.contextId,
      contextData: request.contextData,
      familyMemberId: request.familyMemberId,
      userId: request.userId
    });

    const response = await this.http.post<any>(
      `${this.chatBaseUrl}/start`,
      request,
      { headers: this.getHeaders(true) }
    ).toPromise();

    if (response?.success && response?.data) {
      console.log('[ChatService] Chat started successfully:', response.data);
      return response.data;
    }

    console.error('[ChatService] Failed to start chat:', response?.error);
    throw new Error(response?.error?.message || 'Failed to start chat');
  }

  /**
   * Send a message in a chat session
   */
  async sendMessage(sessionId: string, message: string): Promise<SendMessageResponse> {
    const response = await this.http.post<any>(
      `${this.chatBaseUrl}/${sessionId}/message`,
      { message },
      { headers: this.getHeaders(true) }
    ).toPromise();

    if (response?.success && response?.data) {
      return response.data;
    }
    throw new Error(response?.error?.message || 'Failed to send message');
  }

  /**
   * Get message history with pagination
   */
  async getMessages(sessionId: string, limit: number = 50, cursor?: string): Promise<MessagesResponse> {
    let url = `${this.chatBaseUrl}/${sessionId}/messages?limit=${limit}`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }

    const response = await this.http.get<any>(url, {
      headers: this.getHeaders(false)
    }).toPromise();

    if (response?.success && response?.data) {
      return response.data;
    }
    throw new Error(response?.error?.message || 'Failed to get messages');
  }

  /**
   * Retry the last message if AI response failed
   */
  async retryMessage(sessionId: string): Promise<SendMessageResponse> {
    const response = await this.http.post<any>(
      `${this.chatBaseUrl}/${sessionId}/retry`,
      {},
      { headers: this.getHeaders(true) }
    ).toPromise();

    if (response?.success && response?.data) {
      return response.data;
    }
    throw new Error(response?.error?.message || 'Failed to retry message');
  }

  /**
   * Get list of user's chat sessions
   */
  async listSessions(query?: ListSessionsQuery): Promise<ChatSession[]> {
    let url = `${this.chatBaseUrl}/sessions`;
    const params: string[] = [];

    if (query?.familyMemberId) {
      params.push(`familyMemberId=${query.familyMemberId}`);
    }
    if (query?.contextType) {
      params.push(`contextType=${query.contextType}`);
    }
    if (query?.status) {
      params.push(`status=${query.status}`);
    }

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    const response = await this.http.get<any>(url, {
      headers: this.getHeaders(false)
    }).toPromise();

    if (response?.success && response?.data?.sessions) {
      return response.data.sessions;
    }
    throw new Error(response?.error?.message || 'Failed to get sessions');
  }

  /**
   * Update session metadata (rename)
   */
  async updateSession(sessionId: string, update: UpdateSessionRequest): Promise<ChatSession> {
    const response = await this.http.patch<any>(
      `${this.chatBaseUrl}/${sessionId}`,
      update,
      { headers: this.getHeaders(true) }
    ).toPromise();

    if (response?.success && response?.data?.session) {
      return response.data.session;
    }
    throw new Error(response?.error?.message || 'Failed to update session');
  }

  /**
   * Archive a chat session
   */
  async archiveSession(sessionId: string): Promise<ChatSession> {
    const response = await this.http.put<any>(
      `${this.chatBaseUrl}/${sessionId}/archive`,
      {},
      { headers: this.getHeaders(true) }
    ).toPromise();

    if (response?.success && response?.data?.session) {
      return response.data.session;
    }
    throw new Error(response?.error?.message || 'Failed to archive session');
  }

  /**
   * Delete a chat session permanently
   */
  async deleteSession(sessionId: string): Promise<void> {
    const response = await this.http.delete<any>(
      `${this.chatBaseUrl}/${sessionId}`,
      { headers: this.getHeaders(true) }
    ).toPromise();

    if (response?.success) {
      return;
    }
    throw new Error(response?.error?.message || 'Failed to delete session');
  }

  /**
   * Helper: Quick start chat from any context
   * This is a convenience method to launch chat from anywhere in the app
   */
  async quickStartChat(
    contextType: ChatContextType,
    contextId?: string,
    contextData?: any
  ): Promise<StartChatResponse> {
    const user: any = this.storageService.get('user');
    const selectedMember: any = this.storageService.get('selectedFamilyMember');

    if (!user || !selectedMember) {
      throw new Error('User or family member not found');
    }

    const request: StartChatRequest = {
      userId: user.profileId || user._id,
      familyMemberId: selectedMember._id || selectedMember.profileId,
      contextType,
      contextId: contextId || null,
      contextData: contextData || {}
    };

    return this.startChat(request);
  }

  /**
   * LAUNCHER: Start chat and navigate to chat page
   * This is the main entry point to launch chat from anywhere in the app
   *
   * Usage examples:
   * - From visit: chatService.launchChat('VISIT', visitId, { hospitalCode, patientId })
   * - From appointment: chatService.launchChat('APPOINTMENT', appointmentId)
   * - From prescription: chatService.launchChat('PRESCRIPTION', prescriptionId)
   * - General chat: chatService.launchChat('GENERAL')
   */
  async launchChat(
    contextType: ChatContextType,
    contextId?: string,
    contextData?: any
  ): Promise<void> {
    try {
      // Start or resume the chat
      const response = await this.quickStartChat(contextType, contextId, contextData);

      // Navigate to chat page with session data
      this.router.navigate([`/chat/${response.session._id}`], {
        state: { sessionData: response }
      });
    } catch (error) {
      console.error('Failed to launch chat:', error);
      throw error;
    }
  }
}
