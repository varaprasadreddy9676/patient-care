import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatContextType } from './chat.models';

export interface ChatContext {
  contextType: ChatContextType | null;
  contextId?: string;
  contextData?: any;
}

/**
 * Service to track the current page context for AI chat
 * Pages register their context when loaded, header reads it when AI button is clicked
 */
@Injectable({
  providedIn: 'root'
})
export class ChatContextService {
  private currentContext = new BehaviorSubject<ChatContext>({ contextType: null });
  public currentContext$ = this.currentContext.asObservable();

  /**
   * Register context for the current page
   * Call this from pages like visit-details, prescription, etc.
   */
  setContext(contextType: ChatContextType, contextId?: string, contextData?: any) {
    this.currentContext.next({
      contextType,
      contextId,
      contextData
    });
  }

  /**
   * Clear context (call when navigating away from context pages)
   */
  clearContext() {
    this.currentContext.next({ contextType: null });
  }

  /**
   * Get the current context synchronously
   */
  getContext(): ChatContext {
    return this.currentContext.value;
  }

  /**
   * Check if there's an active context
   */
  hasContext(): boolean {
    return this.currentContext.value.contextType !== null;
  }
}
