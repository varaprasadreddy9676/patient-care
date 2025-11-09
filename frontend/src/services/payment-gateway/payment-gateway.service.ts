import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { ActionSheetController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
// import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { environment } from '../../environments/environment';

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id?: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: object;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: object;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      on: (event: string, handler: (response: RazorpayError) => void) => void;
      open: () => void;
    };
  }
}

export interface TransactionDetails {
  paymentGatewayKey: string;
  orderId: string;
  payerName: string;
  payerPhoneNumber: string;
  payerEmail: string;
  description: string;
  amount: number;
  appName: string;
  upi: any;
  paymentType: number;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentGatewayService {
  constructor(
    private platform: Platform,
    private actionSheetController: ActionSheetController
  ) {
    // this.initializeApp();
    this.loadRazorpay();
  }

  // private initializeApp() {
  //   this.platform.ready().then(() => {
  //     App.addListener('resume', this.onResume);
  //   });
  // }

  private onResume = () => {
    // Re-register the payment callbacks if needed
  };

  private loadRazorpay() {
    if (typeof window !== 'undefined' && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
      script.onload = () => {
        // // // console.log('Razorpay script loaded');
      };
    }
  }

  public async makePayment(
    trxDetails: TransactionDetails,
    successCallbackFun: (data: any) => void,
    cancelCallbackFun: (data: any) => void
  ) {
    switch (trxDetails.paymentType) {
      case 1:
        await this.chooseUPIPaymentType(
          trxDetails,
          successCallbackFun,
          cancelCallbackFun
        );
        break;
      case 2:
        await this.payWithRazorpay(
          trxDetails,
          successCallbackFun,
          cancelCallbackFun
        );
        break;
      default:
        await this.choosePaymentType(
          trxDetails,
          successCallbackFun,
          cancelCallbackFun
        );
    }
  }

  private async chooseUPIPaymentType(
    trxDetails: TransactionDetails,
    successCallbackFun: (data: any) => void,
    cancelCallbackFun: (data: any) => void
  ) {
    const actionSheet = await this.actionSheetController.create({
      buttons: [
        {
          text: 'Google Pay',
          cssClass: 'googlePayIcon',
          handler: () => {
            this.payWithUPI(
              trxDetails,
              successCallbackFun,
              cancelCallbackFun,
              'google'
            );
          },
        },
        {
          text: 'BHIM',
          cssClass: 'bhimIcon',
          handler: () => {
            this.payWithUPI(
              trxDetails,
              successCallbackFun,
              cancelCallbackFun,
              'bhim'
            );
          },
        },
      ],
    });
    await actionSheet.present();
  }

  private async choosePaymentType(
    trxDetails: TransactionDetails,
    successCallbackFun: (data: any) => void,
    cancelCallbackFun: (data: any) => void
  ) {
    const actionSheet = await this.actionSheetController.create({
      buttons: [
        {
          text: 'Google Pay',
          cssClass: 'googlePayIcon',
          handler: () => {
            this.payWithUPI(
              trxDetails,
              successCallbackFun,
              cancelCallbackFun,
              'google'
            );
          },
        },
        {
          text: 'BHIM',
          cssClass: 'bhimIcon',
          handler: () => {
            this.payWithUPI(
              trxDetails,
              successCallbackFun,
              cancelCallbackFun,
              'bhim'
            );
          },
        },
        {
          text: 'Razor Pay',
          cssClass: 'razorPayIcon',
          handler: () => {
            this.payWithRazorpay(
              trxDetails,
              successCallbackFun,
              cancelCallbackFun
            );
          },
        },
      ],
    });
    await actionSheet.present();
  }

  private async payWithUPI(
    trxDetails: TransactionDetails,
    successCallbackFun: (data: any) => void,
    cancelCallbackFun: (data: any) => void,
    serviceName: string
  ) {
    const description = trxDetails.description || 'Consultation';
    const currency = 'INR';

    const packages = {
      paytm: 'net.one97.paytm',
      google: 'com.google.android.apps.nbu.paisa.user',
      bhim: 'in.org.npci.upiapp',
      phonepe: 'com.phonepe.app',
    };

    const url = `upi://pay?pa=${trxDetails.upi.id}&pn=${trxDetails.upi.name}&tr=${trxDetails.orderId}&tid=${trxDetails.orderId}&tn=${description}&am=${trxDetails.amount}&cu=${currency}`;

    if (Capacitor.isNativePlatform()) {
      try {
        await Browser.open({ url, windowName: '_system' });
        // Note: Handling the success/cancel callbacks will be challenging with this method
        // You might need to implement a polling mechanism or use a server-side callback
      } catch (error) {
        // // console.error('Error opening UPI app:', error);
        cancelCallbackFun(error);
      }
    } else {
      // // console.warn('UPI payments are not supported in web browsers');
      cancelCallbackFun({
        error: 'UPI payments are not supported in web browsers',
      });
    }
  }

  private async payWithRazorpay(
    trxDetails: TransactionDetails,
    successCallbackFun: (data: any) => void,
    cancelCallbackFun: (data: any) => void
  ) {
    if (typeof window.Razorpay === 'undefined') {
      // // console.error('Razorpay is not loaded');
      cancelCallbackFun({ error: 'Razorpay is not loaded' });
      return;
    }

    const options: RazorpayOptions = {
      key: trxDetails.paymentGatewayKey,
      amount: trxDetails.amount * 100, // amount in paise
      currency: 'INR',
      name: trxDetails.appName,
      description: trxDetails.description,
      image: `${environment.BASE_URL}/public/images/medics_logo.png`,

      // order_id: trxDetails.orderId,

      handler: (response: RazorpayResponse) => {
        successCallbackFun(response);
      },
      prefill: {
        name: trxDetails.payerName,
        email: trxDetails.payerEmail,
        contact: trxDetails.payerPhoneNumber,
      },
      theme: {
        color: '#6c9904',
      },
      modal: {
        ondismiss: () => {
          cancelCallbackFun({ error: 'Payment cancelled' });
        },
      },
    };

    const razorpayInstance = new window.Razorpay(options);
    razorpayInstance.on('payment.failed', (response: RazorpayError) => {
      cancelCallbackFun(response);
    });
    razorpayInstance.open();
  }
}