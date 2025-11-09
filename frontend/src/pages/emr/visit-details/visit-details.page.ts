import { HttpService } from 'src/services/http/http.service';
import {
  Component,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  IonicModule,
  LoadingController,
  Platform,
  ToastController,
} from '@ionic/angular';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { DateService } from 'src/services/date/date.service';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';
import { SafeUrlPipe } from './safe-url.pipe';
import { trigger, transition, style, animate } from '@angular/animations';
import { ChatService } from 'src/services/chat/chat.service';
import { ChatContextService } from 'src/services/chat/chat-context.service';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

@Component({
  selector: 'app-visits',
  templateUrl: './visit-details.page.html',
  styleUrls: ['./visit-details.page.scss'],
  standalone: true,
  imports: [IonicModule, NgFor, NgIf, CommonModule, SafeUrlPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class visitDetailsPage implements OnInit {
  emrData: any = null;
  visitId: any;
  hospitalCode: any;
  isDownloading: boolean = false;
  patientId: any = 0;
  visitType: any;


   constructor(private router: Router, private httpService: HttpService,
     public dateService: DateService, private loadingController: LoadingController,
     private navService: NavigationService, private platform: Platform, private sanitizer: DomSanitizer,
     private toastController: ToastController, private chatService: ChatService,
     private chatContextService: ChatContextService


   ) {
    this.navService.pageChange('Medical Record');

    this.visitId =
      this.router.getCurrentNavigation()?.extras.state?.['visitId'];
      this.hospitalCode =
      this.router.getCurrentNavigation()?.extras.state?.['hospitalCode'];
      this.patientId =
      this.router.getCurrentNavigation()?.extras.state?.['patientId'];
      this.visitType =
      this.router.getCurrentNavigation()?.extras.state?.['visitType'];

   }

   ngOnInit() {
   }

   async ionViewWillEnter() {
    this.navService.pageChange('EMR Details');
    if (this.visitId && this.hospitalCode) {
      await this.getEMRDocumentsByVisit(this.visitId, this.hospitalCode);

      // Register this visit as the current context for AI chat
      this.chatContextService.setContext(
        'VISIT',
        this.visitId,
        {
          hospitalCode: this.hospitalCode,
          patientId: this.patientId,
          visitType: this.visitType
        }
      );
    }
  }

  ionViewWillLeave() {
    // Clear context when leaving this page
    this.chatContextService.clearContext();
  }
  isLoading = true;

  async getEMRDocumentsByVisit(visitId: any, hospitalCode: any) {
    this.isLoading = true; // Start loading
    const url = `/emr/getEMRDocumentsByVisit?hospitalCode=${hospitalCode}&visitId=${visitId}`;
    try {
      const emrData = await this.httpService.get(url);
      this.emrData = emrData.dayWiseDocuments;
      // // // console.log(this.emrData)

    } catch (error) {
      // // console.error('Failed to fetch EMR data', error);
    } finally {
      this.isLoading = false; // Stop loading
    }
  }

  trustedHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

   decodeHTMLString(encodedHTMLString: string) {
    return encodedHTMLString.replace(/&quot;/g, '"');
  }


  async downloadDischargeReport() {
    if (this.isDownloading) return;

    this.isDownloading = true;
    try {
      const toast = await this.toastController.create({
        message: 'Downloading discharge summary...',
        duration: 2000,
        position: 'bottom',
        cssClass: 'download-toast',
        color: 'primary'
      });
      await toast.present();

      const url =
        '/dischargeSummary/?hospitalCode=' +
        this.hospitalCode +
        '&patientId=' +
        this.patientId +
        '&visitId=' +
        this.visitId;

      const response = await this.httpService.get(url);

      if (response && response.base64Data) {
        const base64Data = response.base64Data;
        const blob = this.base64ToBlob(base64Data, 'application/pdf');
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Discharge_Summary_${this.visitId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);

        const successToast = await this.toastController.create({
          message: 'Download completed successfully!',
          duration: 2000,
          position: 'bottom',
          cssClass: 'download-toast',
          color: 'success',
          buttons: [
            {
              icon: 'checkmark-circle',
              role: 'cancel'
            }
          ]
        });
        await successToast.present();
      }
    } catch (error) {
      // // console.error('Failed to download discharge report', error);
      const errorToast = await this.toastController.create({
        message: 'Failed to download summary',
        duration: 2000,
        position: 'bottom',
        cssClass: 'download-toast',
        color: 'danger',
        buttons: [
          {
            icon: 'close-circle',
            role: 'cancel'
          }
        ]
      });
      await errorToast.present();
    } finally {
      this.isDownloading = false;
    }
  }

  /**
   * Open AI chat for this visit
   */
  async openChat() {
    try {
      await this.chatService.launchChat(
        'VISIT',
        this.visitId,
        {
          hospitalCode: this.hospitalCode,
          patientId: this.patientId,
          visitType: this.visitType
        }
      );
    } catch (error) {
      console.error('Failed to open chat:', error);
      const errorToast = await this.toastController.create({
        message: 'Failed to start chat. Please try again.',
        duration: 2000,
        position: 'bottom',
        color: 'danger'
      });
      await errorToast.present();
    }
  }

  private base64ToBlob(base64: string, type: string): Blob {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: type });
  }

}
