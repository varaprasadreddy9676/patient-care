import { HttpService } from 'src/services/http/http.service';
import {
  Component,
  OnInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import {
  IonicModule,
  LoadingController,
  Platform,
} from '@ionic/angular';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { DateService } from 'src/services/date/date.service';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { PageNavigationService } from '../../../services/navigation/page-navigation.service';
import { GlobalFamilyMemberService, FamilyMember } from '../../../services/family-member/global-family-member.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-visits',
  templateUrl: './visits.page.html',
  styleUrls: ['./visits.page.scss'],
  standalone: true,
  imports: [IonicModule, NgFor, NgIf, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class visitsPage implements OnInit, OnDestroy {
   visits: any[] = []; // Initialize as empty array
   showProgress = false;
   sortOrder = 'LATEST';
   configTemp = { showHistory: false };
   patientId: any;
   familyMember: any;
   patient: any;
   utilityService: any;
   isLoading = true;
   private subscriptions = new Subscription();

   constructor(private router: Router, private httpService: HttpService,
     public dateService: DateService, private loadingController: LoadingController,
     private navService: NavigationService, private platform: Platform,
     private pageNavService: PageNavigationService,
     private globalFamilyMemberService: GlobalFamilyMemberService

   ) {
    this.navService.pageChange('Medical Record');
    
    // Get family member from navigation state or from global service
    this.familyMember = 
      this.router.getCurrentNavigation()?.extras.state?.['familyMember'] ||
      this.globalFamilyMemberService.getSelectedMember();
   }

   /**
    * Load medical records for the selected family member
    */
   async loadMedicalRecords() {
     if (!this.familyMember) {
       // // console.warn('No family member selected for medical records');
       return;
     }

     // // // console.log('Loading medical records for:', this.familyMember.fullName);
     await this.getFamilyMemberHospitalAccount();
     if (this.patient) {
       await this.getEMRVisits(this.patient);
     }
   }

   /**
    * Refresh medical records when family member selection changes
    */
   async refreshMedicalRecords() {
     // // // console.log('Refreshing medical records for new family member:', this.familyMember?.fullName || 'Unknown');

     // Reset data
     this.patient = null;
     this.visits = [];
     this.isLoading = true;

     try {
       // Load new data
       await this.loadMedicalRecords();
     } catch (error) {
       // // console.error('Error refreshing medical records:', error);
       this.isLoading = false;
     }
   }

   ngOnInit() {
     // Subscribe to family member changes for auto-refresh
     this.subscriptions.add(
       this.globalFamilyMemberService.selectedFamilyMember$.subscribe(member => {
         if (member && member !== this.familyMember) {
           // // // console.log('Family member changed in medical records, refreshing data for:', member.fullName);
           this.familyMember = member;
           this.refreshMedicalRecords();
         }
       })
     );

     // Data loading is now handled in ionViewWillEnter to avoid double loading
     // This prevents the flickering issue
   }

   ngOnDestroy() {
     this.pageNavService.cleanup();
     this.subscriptions.unsubscribe();
   }


   async getFamilyMemberHospitalAccount() {
     const getFamilyMemberHospitalAccountURL =
       '/familyMemberHospitalAccount/?familyMemberId=' + this.familyMember._id;

     await this.httpService
       .get(getFamilyMemberHospitalAccountURL)
       .then((hospitalAccount) => {
         this.patient = hospitalAccount[0];
         // // // console.log(hospitalAccount);
       })
       .catch((error) => {
         // // console.error('Error', error);
         this.utilityService.presentAlert(
           'Try again.',
           'Failed to fetch family member.'
         );
       });
   }



   async ionViewWillEnter() {
     this.navService.pageChange('Medical Record');

     // Setup back button first
     this.pageNavService.setupBackButton([
       {
         route: '/emr-visits',
         handler: () => this.router.navigate(['patient-list'])
       },
       {
         route: '/home/emr-visits',
         handler: () => this.router.navigate(['/home/patient-list'])
       }
     ]);

     // Load data only once here (prevents double loading with ngOnInit)
     if (this.familyMember) {
       await this.getFamilyMemberHospitalAccount();
       if (this.patient) {
         await this.getEMRVisits(this.patient);
       }
     }
   }

  async getEMRVisits(patient: any) {
    this.isLoading = true; // Start loading
    const url = `/emr/getVisits?hospitalCode=${patient.hospitalCode}&patientId=${patient.patientId}`;
    try {
      const response = await this.httpService.get(url);
      // // // console.log('EMR API Response:', response);
      
      // Handle different response structures
      let visitsData = [];
      if (response && response.visits && Array.isArray(response.visits)) {
        visitsData = response.visits;
      } else if (response && Array.isArray(response)) {
        visitsData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        visitsData = response.data;
      } else {
        // // console.warn('Unexpected response structure:', response);
        visitsData = [];
      }
      
      // Process visits data
      this.visits = visitsData.map((visit: any) => {
        let visitDate;
        try {
          if (visit.visitDateTime) {
            // Handle different date formats (DD/MM/YYYY, YYYY-MM-DD, etc.)
            if (visit.visitDateTime.includes('/')) {
              visitDate = new Date(visit.visitDateTime.split('/').reverse().join('-'));
            } else {
              visitDate = new Date(visit.visitDateTime);
            }
            // Check if date is valid
            if (isNaN(visitDate.getTime())) {
              visitDate = new Date(); // Fallback to current date
            }
          } else {
            visitDate = new Date(); // Fallback to current date
          }
        } catch (error) {
          // // console.warn('Error parsing visit date:', visit.visitDateTime, error);
          visitDate = new Date(); // Fallback to current date
        }
        
        return {
          ...visit,
          visitDateTime: visitDate,
        };
      });
      
      // // // console.log('Processed visits:', this.visits);
    } catch (error) {
      // // console.error('Failed to fetch EMR data', error);
      this.visits = []; // Ensure visits is always an array
    } finally {
      this.isLoading = false; // Stop loading
    }
  }


   navigateToVisitDetail(visit: any) {

        const navigationExtras: NavigationExtras = {
          state: {
            visitId: visit.id,
            visitType: visit.type,
            patientId: this.patient.patientId,
            hospitalCode: this.patient.hospitalCode
          },
        };

     // Navigate to the new visit summary page with document thumbnails
     this.router.navigate(['/home/emr-visit-summary'], navigationExtras);
   }

   getInitials(fullName: string): string {
     if (!fullName) return '?';
     
     const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
     if (nameParts.length === 1) {
       return nameParts[0].substring(0, 2).toUpperCase();
     }
     
     return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
   }


   sanitizeDoctorName(doctorName: string): string {
     if (!doctorName) return '';

     // Check if the name already starts with "Dr." (case insensitive)
     const trimmedName = doctorName.trim();
     if (trimmedName.toLowerCase().startsWith('dr.') || trimmedName.toLowerCase().startsWith('dr ')) {
       return trimmedName;
     }

     return 'Dr. ' + trimmedName;
   }

}
