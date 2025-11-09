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
  ModalController,
} from '@ionic/angular';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { PageNavigationService } from '../../../services/navigation/page-navigation.service';
import { PdfViewerModalComponent } from '../../emr/pdf-viewer-modal/pdf-viewer-modal.component';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { FileOpener } from '@capacitor-community/file-opener';
import { RxSummaryCardComponent, PrescriptionSummary } from './components/rx-summary-card.component';
import { RxItemCardComponent, PrescriptionItem } from './components/rx-item-card.component';
import { RxDocumentCardComponent } from './components/rx-document-card.component';

interface DocumentItem {
  base64String: string;
  displayName: string;
}

interface PrescriptionDrug {
  drugName: string;
  dosage: string;
  dosageDescription: string;
  dosageText: string;
  frequency: number;
  duration: number;
  durationUnit: number;
  totalQty: number;
  uomDescription: string;
  routeDescription: string;
  startDateTime: string;
  endDateTime: string;
  intakeQty: number;
  dailyQty: number;
  remarks?: string;
}

interface PrescriptionSection {
  header: string;
  sectionCode: string;
  sectionDataStr: string;
  patientData: PrescriptionDrug[];
  showContent: boolean;
  showPrint: boolean;
}

interface PrescriptionDocument {
  id: string;
  title: string;
  patient: string;
  visit: string;
  signedBy: string;
  signedByName: string;
  signedDateTime: string;
  recordedDateTime: string;
  state: number;
  stateName: string;
  locked: boolean;
  templateName: string;
  searchContent: string;
  templateData: {
    title: string;
    frames: Array<{
      sections: PrescriptionSection[];
    }>;
  };
  category?: {
    name: string;
    index: number;
  };
}

interface VisitSummaryResponse {
  dischargeSummary?: DocumentItem[];
  labReportSummary?: DocumentItem[];
  artSummary?: DocumentItem[];
  prescriptionPrint?: DocumentItem[];
  prescriptionDocumentArr?: PrescriptionDocument[];
  medicalSummary?: any[];
}

@Component({
  selector: 'app-prescription-visit-detail',
  templateUrl: './prescription-visit-detail.page.html',
  styleUrls: ['./prescription-visit-detail.page.scss'],
  standalone: true,
  imports: [IonicModule, NgFor, NgIf, CommonModule, RxSummaryCardComponent, RxItemCardComponent, RxDocumentCardComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PrescriptionVisitDetailPage implements OnInit {
  visitId: any;
  hospitalCode: any;
  patientId: any;
  visitType: any;
  familyMemberId: any;
  isLoading = true;
  prescriptionPrintDocuments: DocumentItem[] = [];
  summaryData: VisitSummaryResponse | null = null;
  prescriptionDocuments: PrescriptionDocument[] = [];
  showPrescriptionDetails = true; // Toggle for showing detailed prescription view

  // Summary data
  summary: PrescriptionSummary = {
    doctor: '',
    date: '',
    itemsCount: 0,
    sheet: ''
  };

  active: PrescriptionItem[] = [];
  expired: PrescriptionItem[] = [];

  isExpiredSectionOpen = false;
  isActiveSectionOpen = false;

  constructor(
    private router: Router,
    private httpService: HttpService,
    private loadingController: LoadingController,
    private navService: NavigationService,
    private platform: Platform,
    private toastController: ToastController,
    private pageNavService: PageNavigationService,
    private modalController: ModalController
  ) {
    this.navService.pageChange('Prescription Details');

    // Get navigation state
    const navigation = this.router.getCurrentNavigation();
    this.visitId = navigation?.extras.state?.['visitId'];
    this.hospitalCode = navigation?.extras.state?.['hospitalCode'];
    this.patientId = navigation?.extras.state?.['patientId'];
    this.visitType = navigation?.extras.state?.['visitType'];
    this.familyMemberId = navigation?.extras.state?.['familyMemberId'];
  }

  ngOnInit() {}

  async ionViewWillEnter() {
    this.navService.pageChange('Prescription Details');
    if (this.visitId && this.hospitalCode) {
      await this.getPrescriptionOnly(this.visitId, this.hospitalCode, this.familyMemberId);
    }

    this.pageNavService.setupBackButton([
      {
        route: '/prescription-visit-detail',
        handler: () => this.router.navigate(['/home/prescription-visits'])
      }
    ]);
  }

  /**
   * Fetch prescription data only from the visit-summary API with fetchPrescriptionOnly=true
   */
  async getPrescriptionOnly(visitRID: string, hospitalCode: string, selectedFamilyMemberId: string) {
    this.isLoading = true;
    const url = `/emr/visit-summary?hospitalCode=${hospitalCode}&visitRID=${visitRID}&selectedFamilyMemberId=${selectedFamilyMemberId}&fetchPrescriptionOnly=true`;

    try {
      const response = await this.httpService.get<VisitSummaryResponse>(url);
      this.summaryData = response;

      // Get only prescription print documents
      this.prescriptionPrintDocuments = response.prescriptionPrint || [];

      // Store prescription documents separately for detailed view
      this.prescriptionDocuments = response.prescriptionDocumentArr || [];

      // Process prescription documents to populate active/expired items
      this.processPrescriptionData();

      if (this.prescriptionPrintDocuments.length === 0 && this.prescriptionDocuments.length === 0) {
        this.showToast('No prescriptions found for this visit', 'warning');
      }
    } catch (error) {
      console.error('Failed to fetch prescriptions', error);
      this.showToast('Failed to load prescriptions', 'danger');
      this.prescriptionPrintDocuments = [];
      this.prescriptionDocuments = [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Process prescription documents to extract active and expired medications
   */
  private processPrescriptionData() {
    this.active = [];
    this.expired = [];

    // Update summary data
    if (this.prescriptionDocuments.length > 0) {
      const firstPrescription = this.prescriptionDocuments[0];
      this.summary.doctor = firstPrescription.signedByName || 'Unknown Doctor';
      this.summary.date = this.formatDate(firstPrescription.signedDateTime || firstPrescription.recordedDateTime);
      this.summary.sheet = firstPrescription.templateName || 'Generic Case Sheet';
    }

    // Process each prescription document to extract medications
    this.prescriptionDocuments.forEach((prescription, prescIndex) => {
      const sections = this.getPrescriptionSections(prescription);

      sections.forEach(section => {
        if (section.patientData && section.patientData.length > 0) {
          section.patientData.forEach((drug, drugIndex) => {
            const item: PrescriptionItem = {
              id: `rx-${prescIndex}-${drugIndex}`,
              name: drug.drugName,
              dose: drug.dosageDescription || drug.dosageText || 'N/A',
              frequency: this.getPatientFriendlyFrequency(drug),
              durationText: this.getDurationText(drug.duration, drug.durationUnit),
              qty: drug.totalQty ? `${drug.totalQty} ${drug.uomDescription || 'units'}` : undefined,
              route: drug.routeDescription || undefined,
              timeOfDay: this.getTimeOfDay(drug.dosageText),
              remarks: drug.remarks || undefined,
              status: this.isDrugActive(drug) ? 'active' : 'expired'
            };

            if (item.status === 'active') {
              this.active.push(item);
            } else {
              // Update duration text for expired items
              item.durationText = drug.endDateTime ? `Ended ${this.formatDate(drug.endDateTime)}` : 'Expired';
              this.expired.push(item);
            }
          });
        }
      });
    });

    // Update summary item count
    const totalItems = this.active.length + this.expired.length;
    this.summary.itemsCount = totalItems;

    // Automatically open the active section if it has prescriptions
    if (this.active.length > 0) {
      this.isActiveSectionOpen = true;
    }
  }

  /**
   * Toggle active prescriptions section visibility
   */
  toggleActiveSection() {
    this.isActiveSectionOpen = !this.isActiveSectionOpen;
  }


  /**
   * Get patient-friendly frequency text
   */
  private getPatientFriendlyFrequency(drug: PrescriptionDrug): string {
    // Prioritize dosageText if available (most patient-friendly)
    if (drug.dosageText && drug.dosageText.trim()) {
      return drug.dosageText;
    }

    // Fallback to dosageDescription
    if (drug.dosageDescription && drug.dosageDescription.trim()) {
      return drug.dosageDescription;
    }

    // If neither is available, construct from frequency and dailyQty
    if (drug.frequency && drug.frequency > 0) {
      const times = drug.frequency;
      if (times === 1) {
        return 'Once daily';
      } else if (times === 2) {
        return 'Twice daily';
      } else if (times === 3) {
        return 'Three times daily';
      } else {
        return `${times} times per day`;
      }
    }

    return 'As needed';
  }

  /**
   * Extract time of day from dosage text
   */
  private getTimeOfDay(dosageText: string): 'Morning' | 'Evening' | 'Night' | undefined {
    if (!dosageText) return undefined;
    const text = dosageText.toLowerCase();
    if (text.includes('morning') || text.includes('breakfast')) return 'Morning';
    if (text.includes('evening') || text.includes('dinner')) return 'Evening';
    if (text.includes('night') || text.includes('bedtime') || text.includes('hs')) return 'Night';
    return undefined;
  }

  /**
   * View PDF document - uses native viewer on mobile, modal on web
   */
  async viewPDF(document: DocumentItem) {
    try {
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        // Native platform - save to temp and open with native viewer
        const toast = await this.toastController.create({
          message: 'Opening document...',
          duration: 1500,
          position: 'bottom',
          color: 'primary'
        });
        await toast.present();

        // Extract base64 data
        let base64Data = document.base64String;
        if (base64Data.startsWith('data:')) {
          base64Data = base64Data.split(',')[1];
        }

        // Save to temporary cache directory
        const fileName = `${document.displayName}_preview.pdf`;
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
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
            pdfData: document.base64String,
            documentName: document.displayName
          },
          cssClass: 'pdf-viewer-modal'
        });

        await modal.present();
      }
    } catch (error) {
      console.error('Failed to view PDF', error);
      this.showToast('Failed to open PDF viewer', 'danger');
    }
  }

  /**
   * Download PDF document
   */
  async downloadPDF(document: DocumentItem) {
    try {
      const toast = await this.toastController.create({
        message: 'Downloading document...',
        duration: 2000,
        position: 'bottom',
        color: 'primary'
      });
      await toast.present();

      // Extract base64 data without prefix if present
      let base64Data = document.base64String;
      if (base64Data.startsWith('data:')) {
        base64Data = base64Data.split(',')[1];
      }

      // Check if running on native platform (Android/iOS)
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        // Mobile platform - use Capacitor Filesystem API
        const fileName = `${document.displayName}.pdf`;

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
                    this.showToast('Failed to open file', 'danger');
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
        const blob = this.base64ToBlob(base64Data, 'application/pdf');
        const url = window.URL.createObjectURL(blob);

        // Create download link
        const link = window.document.createElement('a');
        link.href = url;
        link.download = `${document.displayName}.pdf`;
        window.document.body.appendChild(link);
        link.click();

        // Cleanup
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

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
      this.showToast('Failed to download document', 'danger');
    }
  }

  /**
   * Convert base64 string to Blob
   */
  private base64ToBlob(base64: string, type: string): Blob {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: type });
  }

  /**
   * Show toast message
   */
  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color,
    });
    await toast.present();
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get duration text with unit
   */
  getDurationText(duration: number, durationUnit: number): string {
    const units: { [key: number]: string } = {
      1: 'day',
      7: 'week',
      30: 'month',
      365: 'year'
    };
    const unit = units[durationUnit] || 'day';
    const totalDays = duration * durationUnit;

    if (totalDays === 1) return '1 day';
    if (totalDays < 7) return `${totalDays} days`;
    if (totalDays === 7) return '1 week';
    if (totalDays < 30) return `${Math.round(totalDays / 7)} weeks`;
    if (totalDays < 365) return `${Math.round(totalDays / 30)} months`;
    return `${Math.round(totalDays / 365)} years`;
  }

  /**
   * Get all prescription sections from a prescription document
   */
  getPrescriptionSections(prescription: PrescriptionDocument): PrescriptionSection[] {
    const sections: PrescriptionSection[] = [];
    if (prescription.templateData?.frames) {
      prescription.templateData.frames.forEach(frame => {
        if (frame.sections) {
          sections.push(...frame.sections);
        }
      });
    }
    return sections;
  }

  /**
   * Toggle prescription details view
   */
  togglePrescriptionDetails() {
    this.showPrescriptionDetails = !this.showPrescriptionDetails;
  }

  /**
   * Check if a prescription drug is currently active based on start and end dates
   */
  isDrugActive(drug: PrescriptionDrug): boolean {
    if (!drug.startDateTime || !drug.endDateTime) {
      return false; // If dates are missing, consider inactive
    }

    const now = new Date();
    const startDate = new Date(drug.startDateTime);
    const endDate = new Date(drug.endDateTime);

    // Check if current date is between start and end dates
    return now >= startDate && now <= endDate;
  }

  /**
   * Get status label for a drug
   */
  getDrugStatusLabel(drug: PrescriptionDrug): string {
    if (!drug.startDateTime || !drug.endDateTime) {
      return 'Unknown';
    }

    const now = new Date();
    const startDate = new Date(drug.startDateTime);
    const endDate = new Date(drug.endDateTime);

    if (now < startDate) {
      return 'Upcoming';
    } else if (now > endDate) {
      return 'Expired';
    } else {
      return 'Active';
    }
  }

  /**
   * Get status class for styling
   */
  getDrugStatusClass(drug: PrescriptionDrug): string {
    const status = this.getDrugStatusLabel(drug);
    return `status-${status.toLowerCase()}`;
  }

  /**
   * Toggle expired prescriptions section visibility
   */
  toggleExpiredSection() {
    this.isExpiredSectionOpen = !this.isExpiredSectionOpen;
  }
}
