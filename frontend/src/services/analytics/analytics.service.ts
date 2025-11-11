import { Injectable } from '@angular/core';
import { Angulartics2 } from 'angulartics2';
import { HttpClient } from '@angular/common/http';
import { StorageService } from '../storage/storage.service';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

export interface AnalyticsEvent {
  event: string;
  category?: string;
  details?: string;
  metadata?: any;
  timestamp: number;
  sessionId?: string;
  page?: string;
  userId?: string;
  userName?: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private eventQueue: AnalyticsEvent[] = [];
  private sessionId: string;
  private batchTimer: any;

  // Configuration
  private readonly BATCH_SIZE = 20;
  private readonly BATCH_INTERVAL = 10000; // 10 seconds
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly API_URL = environment.BASE_URL + '/api/auditTrail/batch';

  constructor(
    private angulartics2: Angulartics2,
    private http: HttpClient,
    private storage: StorageService,
    private router: Router
  ) {
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  /**
   * Initialize analytics tracking
   */
  private initialize(): void {
    // Subscribe to angulartics2 event tracking
    this.angulartics2.eventTrack.subscribe((action) => {
      this.queueEvent({
        event: action.action,
        category: action.properties?.category,
        details: action.properties?.label,
        metadata: action.properties,
        timestamp: Date.now()
      });
    });

    // Subscribe to page tracking
    this.angulartics2.pageTrack.subscribe((event) => {
      this.queueEvent({
        event: 'PAGE_VIEW',
        category: 'navigation',
        details: event.path,
        timestamp: Date.now()
      });
    });

    // Start batch timer
    this.startBatchTimer();

    // Send remaining events before page unload
    this.setupBeforeUnload();
  }

  /**
   * Manual tracking method (for non-angulartics2 usage)
   */
  track(event: string, category?: string, details?: string, metadata?: any): void {
    this.angulartics2.eventTrack.next({
      action: event,
      properties: {
        category,
        label: details,
        ...metadata
      }
    });
  }

  /**
   * Convenient shorthand methods
   */
  pageView(pageName: string): void {
    this.angulartics2.pageTrack.next({ path: pageName });
  }

  buttonClick(buttonName: string, location?: string): void {
    this.track('BUTTON_CLICK', 'interaction', buttonName, { location });
  }

  formSubmit(formName: string, success: boolean = true): void {
    this.track(
      success ? 'FORM_SUCCESS' : 'FORM_ERROR',
      'form',
      formName
    );
  }

  error(message: string, errorData?: any): void {
    this.track('ERROR', 'error', message, errorData);
  }

  apiCall(endpoint: string, method: string, statusCode: number, duration?: number): void {
    this.track('API_CALL', 'api', `${method} ${endpoint}`, {
      endpoint,
      method,
      statusCode,
      duration
    });
  }

  /**
   * Queue event for batch sending
   */
  private queueEvent(event: AnalyticsEvent): void {
    try {
      const user = this.storage.get('user');

      const enrichedEvent: AnalyticsEvent = {
        ...event,
        sessionId: this.sessionId,
        page: this.router.url,
        userId: user?.id,
        userName: user?.firstName,
        phone: user?.phone
      };

      this.eventQueue.push(enrichedEvent);

      // Auto-flush if batch size reached
      if (this.eventQueue.length >= this.BATCH_SIZE) {
        this.flushQueue();
      }

      // Prevent memory overflow
      if (this.eventQueue.length > this.MAX_QUEUE_SIZE) {
        this.eventQueue = this.eventQueue.slice(-this.MAX_QUEUE_SIZE);
      }
    } catch (error) {
      console.error('[Analytics] Error queueing event:', error);
    }
  }

  /**
   * Flush event queue to backend
   */
  private async flushQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const user = this.storage.get('user');

      await this.http.post(this.API_URL, {
        events: eventsToSend,
        sessionId: this.sessionId
      }, {
        headers: {
          'Authorization': `Bearer ${user?.token || ''}`
        }
      }).toPromise();

      console.log(`[Analytics] Sent ${eventsToSend.length} events`);
    } catch (error) {
      // Silent fail - add back to queue (limited)
      console.error('[Analytics] Failed to send events:', error);
      if (this.eventQueue.length < this.MAX_QUEUE_SIZE) {
        this.eventQueue.push(...eventsToSend.slice(0, 20));
      }
    }
  }

  /**
   * Start batch timer
   */
  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      this.flushQueue();
    }, this.BATCH_INTERVAL);
  }

  /**
   * Send events before page unload
   */
  private setupBeforeUnload(): void {
    window.addEventListener('beforeunload', () => {
      this.flushQueue();
    });
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup
   */
  ngOnDestroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    this.flushQueue();
  }
}
