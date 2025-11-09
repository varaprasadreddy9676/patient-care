import { NavigationExtras, Router } from '@angular/router';
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
export class AppointmentPaymentService {
  private appointment: any;
  private successCallbackFun: any;
  private cancelCallbackFun: any;
  paymentType = 3;

  constructor(
    private utilityService: UtilityService,
    private httpService: HttpService,
    private paymentGatewayService: PaymentGatewayService,
    private router: Router
  ) {}

  public makePayment(
    appointment: any,
    successCallbackFun:
      | ((
          arg0:
            | {
                paymentTransactionNo: any;
                paymentDetails: { successResponse: any; errorResponse: any };
                _id: string;
              }
            | undefined
        ) => void)
      | undefined,
    cancelCallbackFun:
      | ((
          arg0:
            | {
                paymentTransactionNo: any;
                paymentDetails: { successResponse: any; errorResponse: any };
                _id: string;
              }
            | undefined
        ) => void)
      | undefined
  ) {
    /*
 paymentType: 1 = UPI
 paymentType: 2 = RazorPay
 paymentType: 3 = Multiple
 */
    this.appointment = appointment;
    if (appointment.paymentDetails.upi) {
      if (appointment.paymentDetails.gatewayKey) {
        this.paymentType = 3;
      } else {
        this.paymentType = 1;
      }
    }

    if (appointment.paymentDetails.gatewayKey) {
      if (appointment.paymentDetails.upi) {
        this.paymentType = 3;
      } else {
        this.paymentType = 2;
      }
    }
    this.successCallbackFun = successCallbackFun;
    this.cancelCallbackFun = cancelCallbackFun;

    var cbPaymentSuccess = (successResponse: any) => {
      // // console.log('Payment success with payment id: ' + successResponse);
      this.appointment.paymentTransactionNo =
        successResponse.razorpay_payment_id;
      this.appointment.paymentDetails.successResponse = successResponse;

      const successBookingURL =
        '/appointment/' + this.appointment._id + '/confirm';

      // // console.log('Success booking payload', this.appointment);

      this.httpService
        .put(successBookingURL, this.appointment)
        .then((successBookingResponse) => {
          // // console.log('Success appointment response:', successBookingResponse);

          if (successBookingResponse) {
            // // console.log('Appointment Confirmed', successBookingResponse);
          } else {
            this.utilityService.presentAlert(
              'Appointment not confirmed.',
              'Your appointment is not confirmed due to some technical issue. ' +
                'Please contact the hospital with your payment details.'
            );
          }

          this.successCallbackFun(this.appointment);
        })
        .catch((error) => {
          // // console.error('Error while updating the status', error);

          this.utilityService.presentAlert(
            'Appointment not confirmed.',
            'Your appointment is not confirmed due to some technical issue. ' +
              'Please contact the hospital with your payment details.'
          );

          const navigationExtras: NavigationExtras = {
            state: {
              appointmentDetails: this.appointment,
            },
          };

          this.router.navigate(['/home/appointment-details'], navigationExtras);
        });
    };

    var cbPaymentCancel = (errorResponse: any) => {
   console.log(
        'Payment failed. ' +
          errorResponse.description +
          ' (Error ' +
          errorResponse.code +
          ')'
      );

      this.appointment.paymentDetails.errorResponse = errorResponse;

      this.utilityService.presentAlert(
        'Payment Failed',
        'Your payment against the appointment has failed. Please try again.'
      );

      const failedBookingURL =
        '/appointment/' + this.appointment._id + '/paymentFailed';

      // // console.log('Failed booking payload', this.appointment);

      this.httpService
        .put(failedBookingURL, this.appointment)
        .then((failedBookingResponse) => {
          // // console.log('Failed booking response', failedBookingResponse);

          this.cancelCallbackFun(this.appointment);
        })
        .catch((error) => {
          // // console.error('Error while updating the status', error);
        });
    };

    if (
      appointment.paymentDetails.gatewayKey == null &&
      appointment.paymentDetails.upi == null
    ) {
      this.utilityService.presentAlert(
        'Missing Payment Gateway Details',
        'Payment gateway details are not configured for this hospital.'
      );
      return;
    }

    const trxDetails: TransactionDetails = {
      paymentGatewayKey: appointment.paymentDetails.gatewayKey,
      orderId: appointment._id,
      payerEmail: appointment.patient.email,
      payerName: appointment.patient.name,
      payerPhoneNumber: appointment.patient.phone,
      appName: 'medics',
      amount: appointment.consultationCharge.price,
      description: appointment.consultationCharge.chargeName,
      upi: appointment.paymentDetails.upi
        ? appointment.paymentDetails.upi
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
