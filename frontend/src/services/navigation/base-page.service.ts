import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Injectable()
export abstract class BasePage implements OnDestroy {
  private backButtonSubscription?: Subscription;

  constructor(
    protected platform: Platform,
    protected router: Router
  ) {}

  protected setupBackButton(route: string, backHandler: () => void): void {
    // Clean up any existing subscription
    this.cleanupBackButton();
    
    // Set up new subscription
    this.backButtonSubscription = this.platform.backButton.subscribeWithPriority(10, () => {
      if (this.router.url === route) {
        backHandler();
      }
    });
  }

  protected cleanupBackButton(): void {
    if (this.backButtonSubscription) {
      this.backButtonSubscription.unsubscribe();
      this.backButtonSubscription = undefined;
    }
  }

  ngOnDestroy(): void {
    this.cleanupBackButton();
  }
}