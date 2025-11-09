import { StorageService } from './../storage/storage.service';
import { HttpService } from './../http/http.service';
import {
  PaymentGatewayService,
  TransactionDetails,
} from './payment-gateway.service';
import { UtilityService } from './../utility/utility.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BillPaymentService {
  private bill: any;
  private successCallbackFun: any;
  paymentType = 3;
  user;

  constructor(
    private utilityService: UtilityService,
    private httpService: HttpService,
    private storageService: StorageService,
    private paymentGatewayService: PaymentGatewayService
  ) {
    this.user = this.storageService.get('user');
  }

  public makePayment(
    bill: any,
    successCallbackFun: any,
    cancelCallbackFun: any
  ) {
    this.bill = bill;
    let appointment = bill;
    if (appointment.paymentDetails && appointment.paymentDetails.upi) {
      if (appointment.paymentDetails.gatewayKey) {
        this.paymentType = 3;
      } else {
        this.paymentType = 1;
      }
    }

    if (appointment.paymentDetails && appointment.paymentDetails.gatewayKey) {
      if (appointment.paymentDetails.upi) {
        this.paymentType = 3;
      } else {
        this.paymentType = 2;
      }
    }
    this.successCallbackFun = successCallbackFun;

    const cbPaymentSuccess = (successResponse: any) => {
      // // // // console.log('Payment success with payment id: ' + successResponse);
      this.bill.billPayload.paymentTransactionNo =
        successResponse.razorpay_payment_id
          ? successResponse.razorpay_payment_id
          : '';
      this.bill.billPayload.paymentDetails = successResponse;
      const successURL = '/bill/confirmPayment';

      this.bill.billPayload.phone = this.user.phone;

      if (this.user.email) {
        this.bill.billPayload.email = this.user.email;
      }

      // // // // console.log('Success billing payload', this.bill.billPayload);

      this.httpService
        .postInBackground(successURL, this.bill.billPayload, true)
        .then((response) => {
          // // // console.log('Success bill response:', response);

          if (response) {
            // // // // console.log('bill Confirmed', response);
          } else {
            this.utilityService.presentAlert(
              'Bill not confirmed.',
              'Your bill is not confirmed due to some technical issue. ' +
                'Please contact the hospital with your payment details.'
            );
          }

          this.successCallbackFun(this.bill);
        })
        .catch((error) => {
          // // // console.error('Error', error);

          this.utilityService.presentAlert(
            'Bill not confirmed.',
            'Your bill is not confirmed due to some technical issue. ' +
              'Please contact the hospital with your payment details.'
          );
        });
    };

    const cbPaymentCancel = (errorResponse: any) => {

      this.utilityService.presentAlert(
        'Payment Failed',
        'Your payment against the bill has failed. Please try again.'
      );
    };

    if (
      bill.paymentDetail && bill.paymentDetails.gatewayKey == null &&
      bill.paymentDetails.upi == null
    ) {
      this.utilityService.presentAlert(
        'Missing Payment Gateway Details',
        'Payment gateway details are not configured for this hospital.'
      );
      return;
    }

    const trxDetails: TransactionDetails = {
      paymentGatewayKey: bill.paymentDetails?.gatewayKey,
      orderId: bill.billPayload?.billId,
      payerEmail: this.user.email ? this.user.email : null,
      payerName: this.user.firstName + ' ' + this.user.lastName,
      payerPhoneNumber: this.user.phone,
      appName: 'medics',
      amount: bill.billPayload.price,
      description: bill.billPayload.chargeName,
      upi: bill.paymentDetails.upi
        ? bill.paymentDetails.upi
        : { name: '', id: '' },
      paymentType: this.paymentType,
    };

    this.paymentGatewayService.makePayment(
      trxDetails,
      cbPaymentSuccess,
      cbPaymentCancel
    );
  }
}
