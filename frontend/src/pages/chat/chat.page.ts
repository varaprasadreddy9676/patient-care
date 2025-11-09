import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonContent, NavController, AlertController, IonicModule } from '@ionic/angular';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat/chat.service';
import { ChatSession, ChatMessage, ChatMessageUI, StartChatResponse } from '../../services/chat/chat.models';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [IonicModule, NgIf, NgFor, FormsModule],
})
export class ChatPage implements OnInit {

  @ViewChild(IonContent, { static: false }) content!: IonContent;

  sessionId!: string;
  session!: ChatSession;
  messages: ChatMessageUI[] = [];

  messageText: string = '';
  loading: boolean = true;
  sending: boolean = false;
  loadingOlder: boolean = false;

  nextCursor: string | null = null;
  hasMore: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private chatService: ChatService,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    // Get session data from navigation state or route params
    const navigation = history.state;

    if (navigation?.sessionData) {
      // Coming from start chat - we have initial data
      this.loadFromNavigationState(navigation.sessionData);
    } else {
      // Coming from direct link - need to fetch
      const sessionIdParam = this.route.snapshot.paramMap.get('sessionId');
      if (sessionIdParam) {
        this.sessionId = sessionIdParam;
        this.loadSession();
      } else {
        this.showError('Invalid session');
        this.navCtrl.back();
      }
    }
  }

  /**
   * Load session from navigation state (when starting new chat)
   */
  private loadFromNavigationState(data: StartChatResponse) {
    this.session = data.session;
    this.sessionId = this.session._id;
    this.messages = data.messages.items;
    this.nextCursor = data.messages.pagination.nextCursor;
    this.hasMore = data.messages.pagination.hasMore;
    this.loading = false;

    setTimeout(() => this.scrollToBottom(), 100);
  }

  /**
   * Load session messages (when resuming existing chat)
   */
  private async loadSession() {
    try {
      this.loading = true;
      const response = await this.chatService.getMessages(this.sessionId, 50);
      this.messages = response.items;
      this.nextCursor = response.pagination.nextCursor;
      this.hasMore = response.pagination.hasMore;

      setTimeout(() => this.scrollToBottom(), 100);
    } catch (error: any) {
      this.showError('Failed to load chat: ' + (error?.message || 'Unknown error'));
      this.navCtrl.back();
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load older messages (pagination)
   */
  async loadOlderMessages(event?: any) {
    if (!this.hasMore || this.loadingOlder) {
      event?.target?.complete();
      return;
    }

    try {
      this.loadingOlder = true;
      const response = await this.chatService.getMessages(
        this.sessionId,
        20,
        this.nextCursor ?? undefined
      );

      // Prepend older messages
      this.messages = [...response.items, ...this.messages];
      this.nextCursor = response.pagination.nextCursor;
      this.hasMore = response.pagination.hasMore;

    } catch (error: any) {
      this.showError('Failed to load older messages');
    } finally {
      this.loadingOlder = false;
      event?.target?.complete();
    }
  }

  /**
   * Send a message
   */
  async sendMessage() {
    if (!this.messageText?.trim() || this.sending) {
      return;
    }

    const messageContent = this.messageText.trim();
    this.messageText = '';

    // Optimistic UI update - show user message immediately
    const tempUserMessage: ChatMessageUI = {
      _id: 'temp-' + Date.now(),
      sessionId: this.sessionId,
      role: 'user',
      content: messageContent,
      createdAt: new Date().toISOString(),
      isPending: true
    };
    this.messages.push(tempUserMessage);
    this.scrollToBottom();

    try {
      this.sending = true;
      const response = await this.chatService.sendMessage(this.sessionId, messageContent);

      // Remove temp message and add confirmed messages
      this.messages = this.messages.filter(m => m._id !== tempUserMessage._id);
      this.messages.push(response.userMessage);
      this.messages.push(response.assistantMessage);

      this.scrollToBottom();

    } catch (error: any) {
      // Mark message as failed
      tempUserMessage.isPending = false;
      tempUserMessage.hasError = true;

      const errorMsg = error?.message || '';
      if (errorMsg.includes('503') || errorMsg.includes('unavailable')) {
        this.showRetryOption();
      } else {
        this.showError('Failed to send message: ' + (errorMsg || 'Unknown error'));
      }
    } finally {
      this.sending = false;
    }
  }

  /**
   * Retry last failed message
   */
  async retryLastMessage() {
    try {
      this.sending = true;

      // Remove failed message from UI
      this.messages = this.messages.filter(m => !m.hasError);

      const response = await this.chatService.retryMessage(this.sessionId);
      this.messages.push(response.userMessage);
      this.messages.push(response.assistantMessage);

      this.scrollToBottom();
    } catch (error: any) {
      this.showError('Retry failed: ' + (error?.message || 'Unknown error'));
    } finally {
      this.sending = false;
    }
  }

  /**
   * Show retry option alert
   */
  private async showRetryOption() {
    const alert = await this.alertCtrl.create({
      header: 'AI Temporarily Unavailable',
      message: 'The AI assistant is currently unavailable. Would you like to retry?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Retry',
          handler: () => {
            this.retryLastMessage();
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Show error alert
   */
  private async showError(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Scroll to bottom of chat
   */
  private scrollToBottom() {
    setTimeout(() => {
      this.content?.scrollToBottom(300);
    }, 100);
  }

  /**
   * Check if message is from user
   */
  isUserMessage(message: ChatMessage): boolean {
    return message.role === 'user';
  }

  /**
   * Check if message is system message
   */
  isSystemMessage(message: ChatMessage): boolean {
    return message.role === 'system';
  }

  /**
   * Format timestamp
   */
  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Go back
   */
  goBack() {
    this.navCtrl.back();
  }
}
