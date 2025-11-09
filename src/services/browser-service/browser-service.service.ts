import { Injectable } from '@angular/core';
import { Browser } from '@capacitor/browser';

@Injectable({
  providedIn: 'root',
})
export class BrowserService {
  create: any;
  constructor() {}

  async openWithTheSystemBrowser(url: string): Promise<void> {
    await Browser.open({ url });
  }

  async openStoreLink(): Promise<void> {
    const url =
      'https://play.google.com/store/apps/details?id=com.ubq.medicscare';
    await this.openWithTheSystemBrowser(url);
  }
}