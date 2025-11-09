import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class DeviceWidthService {
  isMobile = false;
  public devWidth = this.platform.width();

  constructor(private platform: Platform) {
    // // // console.log(this.devWidth);
    if (this.devWidth < 600) {
      this.isMobile = true;
    }
  }
}