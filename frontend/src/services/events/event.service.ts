import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface EventData {
  event: string;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private eventSubject: Subject<EventData> = new Subject<EventData>();

  // Publish an event
  publish(event: string, data: any): void {
    this.eventSubject.next({ event, data });
  }

  // Subscribe to an event
  on(eventName: string): Observable<any> {
    return new Observable(observer => {
      const subscription = this.eventSubject.subscribe(eventData => {
        if (eventData.event === eventName) {
          observer.next(eventData.data);
        }
      });

      // Return unsubscribe function
      return () => subscription.unsubscribe();
    });
  }
}