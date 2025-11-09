import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private pageTitle = new BehaviorSubject('');
  private reminderCount = new BehaviorSubject(0);
  private gotoReminder = new BehaviorSubject('false');
  gotoReminder$ = this.gotoReminder.asObservable();
  pageTitle$ = this.pageTitle.asObservable();
  reminderCount$ = this.reminderCount.asObservable();

  changeData(data: string) {
    this.pageTitle.next(data);
  }

  pageChange(title: string) {
    this.pageTitle.next(title);
  }

  gotoReminders(clicked: string) {
    this.gotoReminder.next(clicked);
  }

  getReminderCount(count: number) {
    this.reminderCount.next(count);
  }

  constructor() {}
}