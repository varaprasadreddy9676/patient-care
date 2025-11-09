import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import {
  AlertController,
  ToastController,
  LoadingController,
} from '@ionic/angular';
// import { SmsRetriever } from '@ionic-native/sms-retriever/ngx';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Observable } from 'rxjs';

interface AlertConfig {
  type: 'icon' | 'image';
  source: string;
  color?: string;
  size?: string;
  buttons?: Array<{
    text: string;
    role?: string;
    handler?: () => Promise<void> | void;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class UtilityService {
  playerId: string | undefined;
  showSpinner = false;
  appHashCode = '';
  processingIndicator = false;
  loading!: HTMLIonLoadingElement;
  // smsRetriever: any;

  constructor(
    private alertController: AlertController,
    // private smsRetriever: SmsRetriever,
    public toastController: ToastController,
    private router: Router,
    private loadingController: LoadingController,
    private observer: BreakpointObserver
  ) {
    // this.getAppHashCode();
  }
  isBelowSm(): Observable<BreakpointState> {
    // // // console.log('isBelowSm -- max-width: 575px');
    return this.observer.observe(['(max-width: 575px)']);
  }

  isBelowMd(): Observable<BreakpointState> {
    // // // console.log('isBelowMd -- max-width: 767px');
    return this.observer.observe(['(max-width: 767px)']);
  }

  isBelowLg(): Observable<BreakpointState> {
    // // // console.log('isBelowLg -- max-width: 991px');
    return this.observer.observe(['(max-width: 991px)']);
  }

  isBelowXl(): Observable<BreakpointState> {
    // // // console.log('isBelowXl -- max-width: 1199px');
    return this.observer.observe(['(max-width: 1199px)']);
  }
  getCurrentPath() {
    const currentRouterPath = this.router.url;
    return currentRouterPath;
  }

  async presentLoading() {
    if (this.processingIndicator) {
      this.loading = await this.loadingController.create({
        spinner: 'bubbles',
      });
      setTimeout(async () => {
        if (this.processingIndicator) {
          await this.loading.present();
        }
      }, 1000);
    } else {
      if (this.loading) {
        await this.loading.dismiss();
      }
    }
  }

  async presentToast(toastMessage: string, toastDuration: number) {
    const toast = await this.toastController.create({
      message: toastMessage,
      duration: toastDuration,
    });

    toast.present();
  }

  getGenders() {
    return [
      { index: 1, name: 'Male' },
      { index: 2, name: 'Female' },
      { index: 3, name: 'Others' },
    ];
  }

  getRelations() {
    return [
      { index: 0, name: 'Self' },
      { index: 1, name: 'Spouse' },
      { index: 2, name: 'Child' },
      { index: 3, name: 'Son' },
      { index: 4, name: 'Daughter' },
      { index: 5, name: 'Parent' },
      { index: 6, name: 'Father' },
      { index: 7, name: 'Mother' },
      { index: 8, name: 'Sibling' },
      { index: 9, name: 'Brother' },
      { index: 10, name: 'Sister' },
      { index: 11, name: 'Grandparent' },
      { index: 12, name: 'Grandfather' },
      { index: 13, name: 'Grandmother' },
      { index: 14, name: 'Grandchild' },
      { index: 15, name: 'Grandson' },
      { index: 16, name: 'Granddaughter' },
      { index: 17, name: 'Uncle' },
      { index: 18, name: 'Aunt' },
      { index: 19, name: 'Cousin' },
      { index: 20, name: 'Niece' },
      { index: 21, name: 'Nephew' },
      { index: 22, name: 'Friend' },
      { index: 23, name: 'Partner' },
      { index: 24, name: 'Other' },
    ];
  }

  toISODateTime(date: Date): string {
    // return date.toISOString();
    const isoDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    ).toISOString();
    return isoDate;
  }

  toTitleCase(str: any) {
    str = str.toLowerCase().split(' ');
    for (let i = 0; i < str.length; i++) {
      str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    return str.join(' ');
  }

  dateFormat(date: Date): string {
    let day: string = (date.getDate() + 1).toString();
    day = +day < 10 ? '0' + day : day;
    let month: string = (date.getMonth() + 1).toString();
    month = +month < 10 ? '0' + month : month;
    const year = date.getFullYear().toString();
    const time = date.toLocaleTimeString();
    return day + '/' + month + '/' + year;
  }

  async presentAlert(
    subheader: string,
    message: string,
    alertConfig?: AlertConfig
  ) {
    try {
      // Default configuration
      const defaultConfig: AlertConfig = {
        type: 'icon',
        source: 'alert-circle',
        color: '#ff4961',
        size: '64px',
      };

      const config = { ...defaultConfig, ...alertConfig };

      let mediaElement = '';

      if (config.type === 'icon') {
        mediaElement = `<ion-icon 
          name="${config.source}" 
          style="display: block; margin: 0 auto; font-size: ${config.size}; color: ${config.color};">
        </ion-icon>`;
      }
      // else if (config.type === 'image') {
      //   if(config.source) {
      //     const imageSource = config.source ;

      //     mediaElement = `<img
      //       src="${imageSource}"
      //       style="display: block; margin: 20px auto; width: ${config.size}; height: auto; max-width: 100%;"
      //       alt="Alert Image"
      //     />`;
      //   } else {
      //     // // console.error('Error loading image:');
      //     // Fallback to an icon if image fails
      //     mediaElement = `<ion-icon
      //       name="alert-circle"
      //       style="display: block; margin: 0 auto; font-size: ${config.size}; color: ${config.color};">
      //     </ion-icon>`;
      //   }
      // }

      const alert = await this.alertController.create({
        header: subheader,
        cssClass: 'error-alert',
        message,
        buttons: [
          {
            text: 'OK',
            role: 'cancel',
            cssClass: 'alert-primary-dark-text',
            handler: () => {},
          },
        ],
      });

      await alert.present();

      const alertElement = document.querySelector('ion-alert');
      if (alertElement) {
        const messageElement = alertElement.querySelector('.alert-message');
        if (messageElement) {
          messageElement.innerHTML = `
            <div style="text-align: center;">
              ${mediaElement}
              <div style="margin-top: 10px;">${message}</div>
            </div>
          `;
        }
      }
    } catch (error) {
      // // console.error('Error presenting alert:', error);
    }
  }

  async successAlert(subheader: string, message: string) {
    const alert = await this.alertController.create({
      header: subheader,
      cssClass: 'success-alert',
      // tslint:disable-next-line: object-literal-shorthand
      message: message,
      buttons: [
        {
          text: 'OK',
          role: 'cancel',
          cssClass: 'alert-primary-dark-text',
          handler: (blah) => {},
        },
      ],
    });
    await alert.present();
  }

  getGenderName(object: { gender: number }) {
    if (object.gender === 1) {
      return 'Male';
    } else if (object.gender === 2) {
      return 'Female';
    } else if (object.gender === 3) {
      return 'Others';
    }
  }

  getRelationName(object: { relation: number }) {
    const relations = this.getRelations();
    const relation = relations.find(r => r.index === object.relation);
    return relation ? relation.name : 'Other';
  }

  getGenderIndex(gender: string) {
    if (gender === 'Male') {
      return 1;
    } else if (gender === 'Female') {
      return 2;
    } else if (gender === 'Others') {
      return 3;
    }
  }

  getRelationIndex(relation: string) {
    const relations = this.getRelations();
    const relationObj = relations.find(r => r.name === relation);
    return relationObj ? relationObj.index : 24; // Default to 'Other' index
  }

  /**
   * Format doctor name to avoid "Dr. Dr" duplication
   * Removes any existing "Dr." or "Dr" prefix (case insensitive) and adds a clean "Dr." prefix
   */
  formatDoctorName(doctorName: string): string {
    if (!doctorName) return '';

    // Remove any existing "Dr." or "Dr" prefix (case insensitive) and trim whitespace
    const cleanName = doctorName.replace(/^(dr\.?\s*)/i, '').trim();

    // Add "Dr." prefix only if the name doesn't start with it
    return `Dr. ${cleanName}`;
  }

  // getAppHashCode() {

  //   this.smsRetriever.getAppHash()
  //     .then((res: string) => {
  //       // // // console.log(res);
  //       this.appHashCode = res;
  //     })
  //     .catch((error: any) => // // console.error(error));
  // }
}