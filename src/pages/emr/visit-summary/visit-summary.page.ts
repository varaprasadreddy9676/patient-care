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
import { PdfViewerModalComponent } from '../pdf-viewer-modal/pdf-viewer-modal.component';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { FileOpener } from '@capacitor-community/file-opener';

interface DocumentItem {
  base64String: string;
  displayName: string;
  category?: string; // Auto-assigned category for smart rendering
  categoryLabel?: string; // Auto-assigned label from server or default
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
  radReportSummary?: DocumentItem[];
  artSummary?: DocumentItem[];
  prescriptionPrint?: DocumentItem[];
  prescriptionDocumentArr?: PrescriptionDocument[];
  medicalSummary?: any[];
}

@Component({
  selector: 'app-visit-summary',
  templateUrl: './visit-summary.page.html',
  styleUrls: ['./visit-summary.page.scss'],
  standalone: true,
  imports: [IonicModule, NgFor, NgIf, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class VisitSummaryPage implements OnInit {
  visitId: any;
  hospitalCode: any;
  patientId: any;
  visitType: any;
  isLoading = true;
  allDocuments: DocumentItem[] = [];
  summaryData: VisitSummaryResponse | null = null;
  viewMode: 'list' | 'grid' = 'list'; // Default to compact list view
  prescriptionDocuments: PrescriptionDocument[] = [];
  showPrescriptionDetails = true; // Toggle for showing detailed prescription view

  // Smart category configuration - add new types here or they'll use defaults
  private readonly categoryConfig: { [key: string]: { color: string; defaultLabel: string } } = {
    'discharge': { color: 'primary', defaultLabel: 'Discharge Summary' },
    'lab': { color: 'success', defaultLabel: 'Lab Report' },
    'radiology': { color: 'info', defaultLabel: 'Radiology Report' },
    'rad': { color: 'info', defaultLabel: 'Radiology Report' }, // Alias
    'art': { color: 'warning', defaultLabel: 'ART Summary' },
    'prescription': { color: 'purple', defaultLabel: 'Prescription' },
  };

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
    this.navService.pageChange('Visit Summary');

    // Get navigation state
    const navigation = this.router.getCurrentNavigation();
    this.visitId = navigation?.extras.state?.['visitId'];
    this.hospitalCode = navigation?.extras.state?.['hospitalCode'];
    this.patientId = navigation?.extras.state?.['patientId'];
    this.visitType = navigation?.extras.state?.['visitType'];
  }

  ngOnInit() {}

  async ionViewWillEnter() {
    this.navService.pageChange('Visit Summary');
    if (this.visitId && this.hospitalCode) {
      await this.getVisitSummary(this.visitId, this.hospitalCode);
    }

    this.pageNavService.setupBackButton([
      {
        route: '/emr-visit-summary',
        handler: () => this.router.navigate(['/home/emr-visits'])
      }
    ]);
  }

  /**
   * Fetch visit summary from the new API endpoint
   */
  async getVisitSummary(visitRID: string, hospitalCode: string) {
    this.isLoading = true;
    const url = `/emr/visit-summary?hospitalCode=${hospitalCode}&visitRID=${visitRID}`;

    try {
      const response = await this.httpService.get<VisitSummaryResponse>(url);

      // Null/undefined check for response
      if (!response) {
        throw new Error('Empty response from server');
      }

      this.summaryData = response;

      // Smart document combination - automatically tags each document with its category
      this.allDocuments = [];

      // Process each report type from the response
      Object.keys(response).forEach(key => {
        const value = (response as any)[key];

        // Only process arrays of documents (not prescriptionDocumentArr or medicalSummary)
        if (Array.isArray(value) && key !== 'prescriptionDocumentArr' && key !== 'medicalSummary') {
          const category = this.extractCategoryFromKey(key);
          const categoryLabel = this.getCategoryLabelFromConfig(category);

          // Tag each document with its category - with null checks
          const taggedDocuments = value
            .filter((doc: any) => doc && typeof doc === 'object') // Filter out null/invalid items
            .map((doc: DocumentItem) => ({
              ...doc,
              category,
              categoryLabel: doc?.displayName || categoryLabel, // Safe navigation
              base64String: doc?.base64String || '', // Ensure base64String exists
              displayName: doc?.displayName || 'Unnamed Document' // Ensure displayName exists
            }));

          this.allDocuments.push(...taggedDocuments);
        }
      });

      // Store prescription documents separately for detailed view
      this.prescriptionDocuments = response.prescriptionDocumentArr || [];

      if (this.allDocuments.length === 0 && this.prescriptionDocuments.length === 0) {
        this.showToast('No documents found for this visit', 'warning');
      }
    } catch (error) {
      console.error('Failed to fetch visit summary', error);
      this.showToast('Failed to load visit summary', 'danger');
      this.allDocuments = [];
      this.prescriptionDocuments = [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Extract category identifier from API response key
   * Examples: 'dischargeSummary' -> 'discharge', 'labReportSummary' -> 'lab'
   */
  private extractCategoryFromKey(key: string): string {
    // Null/undefined check
    if (!key || typeof key !== 'string') {
      return 'default';
    }

    // Remove common suffixes like 'Summary', 'Report', 'Print'
    let category = key
      .replace(/Summary$/i, '')
      .replace(/Report$/i, '')
      .replace(/Print$/i, '');

    // Convert to lowercase for consistency
    category = category.toLowerCase().trim();

    // Validate category
    if (!category || category === '') {
      return 'default';
    }

    // Handle special cases
    if (category === 'prescription') return 'prescription';
    if (category === 'discharge') return 'discharge';
    if (category === 'lab') return 'lab';
    if (category === 'rad') return 'radiology';
    if (category === 'art') return 'art';

    return category; // Return as-is for new types
  }

  /**
   * Get category label from configuration, with fallback
   */
  private getCategoryLabelFromConfig(category: string): string {
    if (!category) return 'Document';
    return this.categoryConfig[category]?.defaultLabel || 'Document';
  }

  /**
   * Sanitize filename to remove invalid characters
   * Prevents issues with special characters in file names
   */
  private sanitizeFileName(fileName: string): string {
    if (!fileName) return 'document';

    // Remove or replace invalid filename characters
    return fileName
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') // Replace invalid chars with underscore
      .replace(/\s+/g, '_') // Replace spaces with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .substring(0, 200) // Limit filename length
      .trim();
  }

  /**
   * View PDF document - uses native viewer on mobile, modal on web
   */
  async viewPDF(document: DocumentItem) {
    // Null/undefined check
    if (!document) {
      this.showToast('Invalid document', 'danger');
      return;
    }

    // Check if base64String exists
    if (!document.base64String) {
      this.showToast('Document data not available', 'danger');
      return;
    }

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

        // Validate base64 data
        if (!base64Data || base64Data.trim() === '') {
          throw new Error('Empty document data');
        }

        // Save to temporary cache directory with sanitized filename
        const sanitizedName = this.sanitizeFileName(document.displayName || 'document');
        const fileName = `${sanitizedName}_preview.pdf`;
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
    // Null/undefined check
    if (!document) {
      this.showToast('Invalid document', 'danger');
      return;
    }

    // Check if base64String exists
    if (!document.base64String) {
      this.showToast('Document data not available', 'danger');
      return;
    }

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

      // Validate base64 data
      if (!base64Data || base64Data.trim() === '') {
        throw new Error('Empty document data');
      }

      // Check if running on native platform (Android/iOS)
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        // Mobile platform - use Capacitor Filesystem API with sanitized filename
        const sanitizedName = this.sanitizeFileName(document.displayName || 'document');
        const fileName = `${sanitizedName}.pdf`;

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
        // Web platform - use browser download with sanitized filename
        const blob = this.base64ToBlob(base64Data, 'application/pdf');
        const url = window.URL.createObjectURL(blob);

        // Create download link with sanitized filename
        const sanitizedName = this.sanitizeFileName(document.displayName || 'document');
        const link = window.document.createElement('a');
        link.href = url;
        link.download = `${sanitizedName}.pdf`;
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
   * Includes validation to prevent invalid base64 data
   */
  private base64ToBlob(base64: string, type: string): Blob {
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('Invalid base64 data');
    }

    try {
      const binaryString = window.atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Blob([bytes], { type: type });
    } catch (error) {
      console.error('Failed to decode base64:', error);
      throw new Error('Invalid base64 encoding');
    }
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
   * Get document category for styling
   * Returns the category assigned during document processing
   */
  getDocumentCategory(document: DocumentItem): string {
    if (!document) return 'default';
    return document.category || 'default';
  }

  /**
   * Get document category label - uses server's displayName
   * Falls back to configured label if displayName is not available
   */
  getCategoryLabel(document: DocumentItem): string {
    if (!document) return 'Document';
    // Always prefer the categoryLabel which comes from server's displayName
    return document.categoryLabel || 'Document';
  }

  /**
   * Get color scheme for a category
   * Returns configured color or 'default' for unknown categories
   */
  getCategoryColor(category: string): string {
    if (!category) return 'default';
    return this.categoryConfig[category]?.color || 'default';
  }

  /**
   * Get CSS class for category with automatic fallback
   * Ensures unknown categories get 'default' styling
   */
  getCategoryClass(document: DocumentItem): string {
    if (!document) return 'default';

    const category = this.getDocumentCategory(document);
    const knownCategories = ['discharge', 'lab', 'radiology', 'art', 'prescription'];

    // If category is known and has SCSS styling, use it; otherwise use 'default'
    return knownCategories.includes(category) ? category : 'default';
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
   * Toggle between list and grid view modes
   */
  toggleViewMode() {
    this.viewMode = this.viewMode === 'list' ? 'grid' : 'list';
  }
}
