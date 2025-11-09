// import { File } from '@ionic-native/File/ngx';
// import { FileOpener } from '@ionic-native/file-opener/ngx';
import { UtilityService } from './../../../services/utility/utility.service';
import { HttpService } from './../../../services/http/http.service';
import { StorageService } from './../../../services/storage/storage.service';
import { Component, OnDestroy } from '@angular/core';
import { PageNavigationService } from '../../../services/navigation/page-navigation.service';
import { Router } from '@angular/router';
import { Platform, IonicModule, ToastController, ModalController } from '@ionic/angular';
import { BillPaymentService } from 'src/services/payment-gateway/bill-payment.service';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { NgIf, NgFor } from '@angular/common';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { FileOpener } from '@capacitor-community/file-opener';
import { PdfViewerModalComponent } from '../../emr/pdf-viewer-modal/pdf-viewer-modal.component';

interface Bills {
  billDetail: any;
  receiptAmount: any;
  netAmount: any;
  receiptId: any;
  date: any;
  taxAmount: any;
}

@Component({
  selector: 'app-bill-details',
  templateUrl: './bill-details.page.html',
  styleUrls: ['./bill-details.page.scss'],
  standalone: true,
  imports: [IonicModule, NgIf, NgFor],
})
export class BillDetailsPage implements OnDestroy {
  user;
  bill: Bills[] = [];
  fetchedBill: any;
  pendingAmount!: number;

  constructor(
    private router: Router,
    private storageService: StorageService,
    private httpService: HttpService,
    private platform: Platform,
    private utilityService: UtilityService,
    // private file: File,
    // private fileOpener: FileOpener,
    private billPaymentService: BillPaymentService,
    private navService: NavigationService,
    private pageNavService: PageNavigationService,
    private toastController: ToastController,
    private modalController: ModalController
  ) {
    this.navService.pageChange('Bills');
    this.user = this.storageService.get('user');
    this.fetchedBill =
      this.router.getCurrentNavigation()?.extras.state?.['bill'];
    // // // console.log('Fetched bill', this.fetchedBill);
    this.getBillsDetails(this.fetchedBill);
  }

  ionViewDidEnter() {
    this.navService.pageChange('Bills');
    this.pageNavService.setupBackButton('/bill-details', () => {
      this.router.navigate(['bills']);
    });
  }

  async getBillsDetails(fetchedBill: { entityCode: string; id: string }) {
    this.user = this.storageService.get('user');

    const url =
      '/bill/billDetails/?hospitalCode=' +
      fetchedBill.entityCode +
      '&billId=' +
      fetchedBill.id;

    await this.httpService
      .getInBackground(url, true)
      .then((response: any) => {
        this.bill = response.bill;

        const netAmount = +this.bill[0].netAmount;
        let paidAmount = 0;

        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < this.bill.length; i++) {
          paidAmount += +this.bill[i].receiptAmount;
        }

        this.pendingAmount = netAmount - paidAmount;

        // Log bill details to check structure
        console.log('Bill details', this.bill);
        if (this.bill[0] && this.bill[0].billDetail) {
          console.log('Bill detail items:', this.bill[0].billDetail);
        }
      })
      .catch((error) => {
        // // // console.log('Error!', error);
      });
  }

  getChargeAmount(charge: any): string {
    // Try different possible property names for the amount
    const amount = charge.amount || charge.chargeAmount || charge.Amount ||
                   charge.price || charge.cost || charge.netAmount ||
                   charge.chargeAmt || charge.amt;

    if (amount !== undefined && amount !== null) {
      return amount.toString();
    }

    // If no amount found, log the charge object to help debug
    console.log('Charge object:', charge);
    return '0';
  }

  async downloadPDF(pdf: any, fileName: string = 'bill.pdf') {
    try {
      // Show downloading toast
      const toast = await this.toastController.create({
        message: 'Downloading document...',
        duration: 2000,
        position: 'bottom',
        color: 'primary'
      });
      await toast.present();

      // Extract base64 data without prefix if present
      let base64Data = pdf;
      if (base64Data.startsWith('data:')) {
        base64Data = base64Data.split(',')[1];
      }

      // Check if running on native platform (Android/iOS)
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        // Mobile platform - use Capacitor Filesystem API
        try {
          // For Android, use ExternalStorage directory
          // For iOS, use Documents directory
          const directory = this.platform.is('android')
            ? Directory.ExternalStorage
            : Directory.Documents;

          const path = this.platform.is('android')
            ? `Download/${fileName}` // Android: Save to Downloads folder
            : fileName; // iOS: Save to Documents

          // Write file
          const result = await Filesystem.writeFile({
            path: path,
            data: base64Data,
            directory: directory,
            recursive: true
          });

          console.log('File saved successfully to:', result.uri);

          const successToast = await this.toastController.create({
            message: this.platform.is('android')
              ? `Downloaded successfully!`
              : `Downloaded successfully!`,
            duration: 5000,
            position: 'bottom',
            color: 'success',
            icon: 'checkmark-circle',
            buttons: [
              {
                text: 'Open',
                role: 'action',
                handler: async () => {
                  try {
                    await FileOpener.open({
                      filePath: result.uri,
                      contentType: 'application/pdf',
                      openWithDefault: true
                    });
                  } catch (openError) {
                    console.error('Failed to open file:', openError);
                    const errorToast = await this.toastController.create({
                      message: 'Failed to open file',
                      duration: 2500,
                      position: 'bottom',
                      color: 'danger'
                    });
                    await errorToast.present();
                  }
                }
              },
              {
                text: 'Dismiss',
                role: 'cancel'
              }
            ]
          });
          await successToast.present();
        } catch (fsError: any) {
          console.error('Filesystem error:', fsError);
          console.error('Error details:', JSON.stringify(fsError));
          throw fsError;
        }
      } else {
        // Web platform - use browser download
        const linkSource = `data:application/pdf;base64,${base64Data}`;
        const downloadLink = document.createElement('a');

        downloadLink.href = linkSource;
        downloadLink.download = fileName;
        downloadLink.target = '_blank';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        const successToast = await this.toastController.create({
          message: 'Download completed successfully!',
          duration: 2000,
          position: 'bottom',
          color: 'success',
          icon: 'checkmark-circle'
        });
        await successToast.present();
      }
    } catch (error) {
      console.error('Failed to download PDF', error);
      const errorToast = await this.toastController.create({
        message: 'Failed to download document',
        duration: 2500,
        position: 'bottom',
        color: 'danger'
      });
      await errorToast.present();
    }
  }

  async downloadBillPDF() {
    const getBillPDF =
      '/bill/print/?hospitalCode=' +
      this.fetchedBill.entityCode +
      '&billId=' +
      this.fetchedBill.id;

    await this.httpService
      .getInBackground(getBillPDF, true)
      .then((response: any) => {
        if (response && response.bill) {
          const fileName = `bill_${this.fetchedBill.id}.pdf`;
          this.downloadPDF(response.bill.billBase64, fileName);
        }
      })
      .catch((error) => {
        // // console.error('Fetching Error', error);
      });
  }

  async downloadReceipt(receiptId: string) {
    const getPDFPrint =
      '/receipt/print/?hospitalCode=' +
      this.fetchedBill.entityCode +
      '&receiptId=' +
      receiptId;

    await this.httpService
      .getInBackground(getPDFPrint, true)
      .then((response: any) => {
        if (response) {
          const fileName = `receipt_${receiptId}.pdf`;
          this.downloadPDF(response.receipt.receiptBase64, fileName);
        }
      })
      .catch((error) => {
        // // console.error('Fetching Error', error);
      });
  }

  async viewReceipt(receiptId: string) {
    try {
      const toast = await this.toastController.create({
        message: 'Loading receipt...',
        duration: 1500,
        position: 'bottom',
        color: 'primary'
      });
      await toast.present();

      const getPDFPrint =
        '/receipt/print/?hospitalCode=' +
        this.fetchedBill.entityCode +
        '&receiptId=' +
        receiptId;

      const response: any = await this.httpService.getInBackground(getPDFPrint, true);

      if (response && response.receipt && response.receipt.receiptBase64) {
        const base64Data = response.receipt.receiptBase64;
        const isNative = Capacitor.isNativePlatform();

        if (isNative) {
          // Native platform - save to temp and open with native viewer
          let base64String = base64Data;
          if (base64String.startsWith('data:')) {
            base64String = base64String.split(',')[1];
          }

          // Save to temporary cache directory
          const fileName = `receipt_${receiptId}_preview.pdf`;
          const result = await Filesystem.writeFile({
            path: fileName,
            data: base64String,
            directory: Directory.Cache,
            recursive: true
          });

          console.log('Temp file created:', result.uri);

          // Open with native PDF viewer
          await FileOpener.open({
            filePath: result.uri,
            contentType: 'application/pdf',
            openWithDefault: true
          });

        } else {
          // Web platform - use modal viewer
          const modal = await this.modalController.create({
            component: PdfViewerModalComponent,
            componentProps: {
              pdfData: base64Data,
              documentName: `Receipt ${receiptId}`
            },
            cssClass: 'pdf-viewer-modal'
          });

          await modal.present();
        }
      } else {
        throw new Error('Receipt data not found');
      }
    } catch (error) {
      console.error('Failed to view receipt', error);
      const errorToast = await this.toastController.create({
        message: 'Failed to open receipt viewer',
        duration: 2500,
        position: 'bottom',
        color: 'danger'
      });
      await errorToast.present();
    }
  }

  makePayment() {
    const cbPaymentSuccess = (res: any) => {
      this.router.navigate(['/home/bills']);
    };

    const cbPaymentCancel = (res: any) => {};

    let bill = {
      billPayload: {
        hospitalCode: this.fetchedBill.entityCode,
        patientId: this.fetchedBill.patientId,
        billId: this.fetchedBill.id,
        price: this.pendingAmount.toString(),
        billDate: this.fetchedBill.billdate,
        visitId: this.fetchedBill.visitID,
        chargeName: '',
      },
      paymentDetails: this.fetchedBill.paymentDetails,
    };

    this.bill[0].billDetail.map((billDetail: { chargeName: string }) => {
      bill.billPayload.chargeName += billDetail.chargeName + ' ';
    });

    // // // console.log('Proceed to Payment', bill);

    this.billPaymentService.makePayment(
      bill,
      cbPaymentSuccess,
      cbPaymentCancel
    );
  }

  ngOnDestroy() {
    this.pageNavService.cleanup();
  }
}
