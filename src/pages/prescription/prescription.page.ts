import { StorageService } from './../../services/storage/storage.service';
import { UtilityService } from './../../services/utility/utility.service';
import { HttpService } from './../../services/http/http.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastController, AlertController, IonicModule } from '@ionic/angular';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { PageNavigationService } from 'src/services/navigation/page-navigation.service';
import { NgIf, NgFor } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { GlobalFamilyMemberService, FamilyMember } from '../../services/family-member/global-family-member.service';
import { ChatService } from '../../services/chat/chat.service';
import { ChatContextService } from '../../services/chat/chat-context.service';
import { Subscription } from 'rxjs';

interface PrescriptionDetails {
  prescription: string | any;
  patientId: string;
  familyMemberId: string;
  familyMemberName: string;
  familyMemberGender: string;
  pharmacyId : string;
  expanded?: boolean;
}

@Component({
  selector: 'app-prescription',
  templateUrl: './prescription.page.html',
  styleUrls: ['./prescription.page.scss'],
  standalone: true,
  imports: [IonicModule, NgIf, NgFor],
})
export class PrescriptionPage implements OnInit, OnDestroy {
  user;
  prescriptionDetails: PrescriptionDetails[] = [];
  familyMemberName: any;
  noPrescriptions: boolean = false;
  private subscriptions = new Subscription();
  selectedPrescription: PrescriptionDetails | null = null;

  constructor(
    private httpService: HttpService,
    private utilityService: UtilityService,
    private storageService: StorageService,
    private platform: Platform,
    public toastController: ToastController,
    private alertController: AlertController,
    private router: Router,
    private navService: NavigationService,
    private pageNavService: PageNavigationService,
    private globalFamilyMemberService: GlobalFamilyMemberService,
    private chatService: ChatService,
    private chatContextService: ChatContextService
  ) {
    this.navService.pageChange('Prescriptions');
    this.user = this.storageService.get('user');
  }

  ionViewWillEnter() {
    this.navService.pageChange('Prescriptions');
    this.getPrescriptionDetails();
    // Set up back button handling with proper cleanup
    this.pageNavService.setupBackButton('/prescription', () => {
      this.router.navigate(['home']);
    });

    // Register prescription list context - will be updated when a specific prescription is selected/expanded
    this.updatePrescriptionContext();
  }

  ionViewWillLeave() {
    // Clear context when leaving prescription page
    this.chatContextService.clearContext();
  }

  async getPrescriptionDetails() {
    // // console.log('user id:,', this.user.id);

    // Clear the existing array before fetching new data
    this.prescriptionDetails = [];

    const getPrescriptionURL =
      '/prescription/?userId=' + this.user.id + '&activePrescription=false';

    await this.httpService
      .getInBackground(getPrescriptionURL, true)
      .then((prescriptionInfo: any) => {
        // // console.log('Prescription details', prescriptionInfo);

        if (prescriptionInfo && Array.isArray(prescriptionInfo)) {
          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < prescriptionInfo.length; i++) {
          console.log(
              'length',
              prescriptionInfo[i].prescription.prescription.length
            );

            if (prescriptionInfo[i].prescription.prescription.length > 0) {
              this.prescriptionDetails.push(prescriptionInfo[i]);
            }
          }

          // // console.log('Prescription Info', this.prescriptionDetails);
        } else {
          // // console.log('Invalid prescription data received');
          this.noPrescriptions = true;
        }

        this.noPrescriptions = this.prescriptionDetails.length === 0;

        // Update context after loading prescriptions
        this.updatePrescriptionContext();
      })
      .catch((error) => {
        // // console.error('Fetching Error', error);
        this.utilityService.presentAlert('Error!', error.message);
      });
  }

  async showPDF(data: {
    prescription: { prescription: string | any[] };
    patientId: string;
    familyMemberName: string;
  }) {
    // // console.log(data);
    let hospitalCode;
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < data.prescription.prescription.length; i++) {
      hospitalCode = data.prescription.prescription[i].entityCode;
      break;
    }

    const getPDFPrint =
      '/prescription/print/?hospitalCode=' +
      hospitalCode +
      '&patientId=' +
      data.patientId;

    await this.httpService
      .getInBackground(getPDFPrint, true)
      .then(async (prescriptionPrint: any) => {
        if (prescriptionPrint) {


          const fileName = 'Prescription_' + data.familyMemberName + '.pdf';

          if (Capacitor.isNativePlatform()) {
            // For iOS and Android
            const base64Data = prescriptionPrint.prescriptionPrint;

            // Choose the appropriate directory
            const directory = this.platform.is('ios') ? Directory.Documents : Directory.ExternalStorage;

            // Write the file
            const result = await Filesystem.writeFile({
              path: fileName,
              data: base64Data,
              directory: directory,
              recursive: true
            });

            // Open the file with the default viewer
            await Filesystem.getUri({
              path: fileName,
              directory: directory
            }).then(async (uriResult) => {
              // Open the file using Capacitor's built-in webview
              window.open(Capacitor.convertFileSrc(uriResult.uri), '_blank');
            });
          } else {
            const linkSource = `data:application/pdf;base64,${prescriptionPrint.prescriptionPrint}`;
            const downloadLink = document.createElement('a');

            downloadLink.href = linkSource;
            downloadLink.download = fileName;
            downloadLink.target = '_blank';
            document.body.appendChild(downloadLink);
            downloadLink.click();
          }
        }
      })
      .catch((error) => {
        // // console.error('Fetching Error', error);
      });
  }

  // viewPDFFile(folderpath, fileName) {

  // this.utilityService.presentAlert('Downloaded', 'File downloaded in internal storage');

  //   try {
  //     this.fileOpener.open(folderpath + fileName, 'application/pdf')
  //       .then(() => // // console.log('File is opened'))
  //       .catch(e =>
  //         this.utilityService.presentAlert('Can`t open file', e)
  //       );
  //   } catch (ex) {
  //     // // console.log('Error launching the file' + ex);
  //   }

  // }

  getInitials(fullName: string): string {
    if (!fullName) return '?';

    const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }

    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }

  toggleExpansion(prescription: any): void {
    // Close all other expanded prescriptions (accordion behavior)
    this.prescriptionDetails.forEach(p => {
      if (p !== prescription) {
        p.expanded = false;
      }
    });

    // Toggle the clicked prescription
    prescription.expanded = !prescription.expanded;

    // Update selected prescription and context
    if (prescription.expanded) {
      this.selectedPrescription = prescription;
      this.updatePrescriptionContext();

      // Scroll to top after a short delay
      setTimeout(() => {
        const prescriptionIndex = this.prescriptionDetails.indexOf(prescription);
        const prescriptionRow = document.querySelector(`.prescription-row:nth-child(${prescriptionIndex + 1})`) as HTMLElement;

        if (prescriptionRow) {
          prescriptionRow.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 100); // Small delay to allow the expansion animation to start
    } else {
      this.selectedPrescription = null;
      this.updatePrescriptionContext();
    }
  }

  /**
   * Extract hospitalCode from prescription data
   */
  private getHospitalCode(prescription: PrescriptionDetails): string | undefined {
    if (prescription?.prescription?.prescription &&
        Array.isArray(prescription.prescription.prescription) &&
        prescription.prescription.prescription.length > 0) {
      return prescription.prescription.prescription[0].entityCode;
    }
    return undefined;
  }

  /**
   * Update the chat context based on selected prescription
   * If a prescription is expanded, register it as context
   * Otherwise, use the first prescription or clear context
   */
  private updatePrescriptionContext(): void {
    const prescription = this.selectedPrescription ||
                        (this.prescriptionDetails.length > 0 ? this.prescriptionDetails[0] : null);

    if (prescription) {
      const prescriptionId = prescription.pharmacyId || prescription.prescription?._id;
      const hospitalCode = this.getHospitalCode(prescription);

      this.chatContextService.setContext(
        'PRESCRIPTION',
        prescriptionId,
        {
          hospitalCode: hospitalCode,
          patientId: prescription.patientId
        }
      );
    } else {
      this.chatContextService.clearContext();
    }
  }

  ngOnInit() {
    // Subscribe to family member changes to refresh prescription data
    let isFirstEmission = true;

    this.subscriptions.add(
      this.globalFamilyMemberService.selectedFamilyMember$.subscribe(
        (member: FamilyMember | null) => {
          // Only reload if this is not the first emission
          // First emission happens on init, data will be loaded by ionViewWillEnter
          if (!isFirstEmission && member) {
            // Reload prescriptions for the newly selected family member
            this.prescriptionDetails = [];
            this.getPrescriptionDetails();
          }
          isFirstEmission = false;
        }
      )
    );
  }

  /**
   * Open AI chat for prescription
   */
  async openChat(prescription: PrescriptionDetails) {
    try {
      // Get prescription ID (first prescription's ID or pharmacy ID)
      const prescriptionId = prescription.pharmacyId || prescription.prescription?._id;
      const hospitalCode = this.getHospitalCode(prescription);

      // Launch chat with prescription context
      await this.chatService.launchChat(
        'PRESCRIPTION',
        prescriptionId,
        {
          hospitalCode: hospitalCode,
          patientId: prescription.patientId
        }
      );
    } catch (error) {
      console.error('Failed to open chat:', error);
      this.utilityService.presentAlert('Error', 'Failed to start chat. Please try again.');
    }
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.unsubscribe();
    // Clean up back button handler
    this.pageNavService.cleanupBackButton('/prescription');
  }
}
