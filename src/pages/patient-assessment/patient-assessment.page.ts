import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, IonicModule, AlertController } from '@ionic/angular';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PatientAssessmentService } from '../../services/patient-assessment/patient-assessment.service';
import { StorageService } from '../../services/storage/storage.service';
import { GlobalFamilyMemberService } from '../../services/family-member/global-family-member.service';
import { HttpService } from '../../services/http/http.service';

@Component({
  selector: 'app-patient-assessment',
  templateUrl: './patient-assessment.page.html',
  styleUrls: ['./patient-assessment.page.scss'],
  standalone: true,
  imports: [IonicModule, NgIf, NgFor, FormsModule],
})
export class PatientAssessmentPage implements OnInit, OnDestroy {

  patientId: string = '';
  patientName: string = '';
  hospitalName: string = '';
  mrn: string = '';
  userRequest: string = '';
  assessmentMonths: number = 12; // Default to 12 months

  loading: boolean = false;
  loadingPatientInfo: boolean = false;

  // Chat-style conversation history
  conversationHistory: Array<{
    question: string;
    response: SafeHtml;
    timestamp: Date;
  }> = [];

  private currentFamilyMemberId: string = '';

  // Helper getter for UI
  get hasConversation(): boolean {
    return this.conversationHistory.length > 0;
  }

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private sanitizer: DomSanitizer,
    private assessmentService: PatientAssessmentService,
    private storageService: StorageService,
    private globalFamilyMemberService: GlobalFamilyMemberService,
    private httpService: HttpService
  ) {}

  ngOnInit() {
    // Initialize patient context
    this.initializePatientContext();
  }

  ngOnDestroy() {
    // Clean up - clear conversation history when leaving page
    this.conversationHistory = [];
    this.userRequest = '';
  }

  /**
   * Initialize patient context from route params or selected family member
   */
  private async initializePatientContext() {
    try {
      // Try to get from selected family member first
      const selectedMember = this.globalFamilyMemberService.getSelectedMember();

      if (!selectedMember) {
        this.showError('Please select a family member first');
        this.navCtrl.back();
        return;
      }

      this.currentFamilyMemberId = this.globalFamilyMemberService.getMemberId(selectedMember);

      if (!this.currentFamilyMemberId) {
        this.showError('Invalid family member ID');
        this.navCtrl.back();
        return;
      }

      this.patientName = selectedMember.fullName ||
        (selectedMember.firstName + ' ' + (selectedMember.lastName || ''));

      // Fetch hospital account to get patientId
      await this.fetchPatientHospitalAccount(this.currentFamilyMemberId);

      // Validate patient ID after fetch
      if (!this.patientId) {
        this.showError('Patient hospital account not found. Please ensure the patient is registered with a hospital.');
        this.navCtrl.back();
        return;
      }
    } catch (error: any) {
      console.error('Error initializing patient context:', error);
      this.showError(error.message || 'Failed to load patient information');
      this.navCtrl.back();
    }
  }

  /**
   * Fetch patient hospital account to get patientId
   */
  private async fetchPatientHospitalAccount(familyMemberId: string): Promise<void> {
    try {
      this.loadingPatientInfo = true;
      console.log('[PatientAssessment] Fetching hospital account for familyMemberId:', familyMemberId);

      const url = `/familyMemberHospitalAccount/?familyMemberId=${familyMemberId}`;
      const hospitalAccounts: any = await this.httpService.get(url);

      console.log('[PatientAssessment] Hospital accounts response:', hospitalAccounts);

      if (hospitalAccounts && hospitalAccounts.length > 0) {
        const account = hospitalAccounts[0];
        this.patientId = account.patientId;
        this.hospitalName = account.hospitalName || '';
        this.mrn = account.mrn || '';

        console.log('[PatientAssessment] Patient context set:', {
          patientId: this.patientId,
          hospitalName: this.hospitalName,
          mrn: this.mrn
        });
      } else {
        throw new Error('No hospital account found for this family member');
      }
    } catch (error: any) {
      console.error('[PatientAssessment] Error fetching patient hospital account:', error);
      throw error;
    } finally {
      this.loadingPatientInfo = false;
    }
  }

  /**
   * Handle Enter key press (Shift+Enter for new line, Enter to send)
   */
  handleEnter(event: any) {
    if (event.shiftKey) {
      // Allow new line with Shift+Enter
      return;
    } else {
      // Send message with Enter
      event.preventDefault();
      if (!this.loading && !this.loadingPatientInfo && this.userRequest?.trim()) {
        this.getAssessment();
      }
    }
  }

  /**
   * Get patient assessment
   */
  async getAssessment() {
    if (!this.userRequest?.trim()) {
      this.showError('Please enter or select a question');
      return;
    }

    if (!this.patientId) {
      console.error('[PatientAssessment] Patient ID is missing');
      this.showError('Patient ID is missing. Please try reloading the page.');
      return;
    }

    if (!this.currentFamilyMemberId) {
      console.error('[PatientAssessment] Family member ID is missing');
      this.showError('Family member ID is missing. Please try reloading the page.');
      return;
    }

    try {
      this.loading = true;

      console.log('[PatientAssessment] Calling assessment API with:', {
        patientId: this.patientId,
        familyMemberId: this.currentFamilyMemberId,
        userRequest: this.userRequest.trim(),
        assessmentMonths: this.assessmentMonths
      });

      const response = await this.assessmentService.getPatientAssessment(
        this.patientId,
        this.userRequest.trim(),
        this.assessmentMonths,
        this.currentFamilyMemberId
      );

      console.log('[PatientAssessment] Received response:', response ? 'Success' : 'Empty');

      // Add to conversation history
      this.conversationHistory.push({
        question: this.userRequest.trim(),
        response: this.sanitizer.bypassSecurityTrustHtml(response),
        timestamp: new Date()
      });

      // Clear input for next question
      this.userRequest = '';

    } catch (error: any) {
      console.error('[PatientAssessment] Assessment error:', error);
      this.showError(error.message || 'Failed to get assessment');
    } finally {
      this.loading = false;
    }
  }



  /**
   * Show error alert
   */
  private async showError(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Go back
   */
  goBack() {
    this.navCtrl.back();
  }
}
