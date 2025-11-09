import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { NavigationExtras, Router } from '@angular/router';
import { AlertController, IonicModule, Platform } from '@ionic/angular';
import { HttpService } from 'src/services/http/http.service';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { StorageService } from 'src/services/storage/storage.service';
import { UtilityService } from 'src/services/utility/utility.service';
import { PageNavigationService } from 'src/services/navigation/page-navigation.service';

@Component({
  selector: 'app-profiles',
  templateUrl: './profiles.component.html',
  styleUrls: ['./profiles.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, MatButton],
})
export class RecordsComponent implements OnInit, OnDestroy {
  user: any;
  familyMembers: any;
  phone: any;
  isLoading = false;

  constructor(
    private storageService: StorageService,
    private httpService: HttpService,
    private utilityService: UtilityService,
    private navService: NavigationService,
    private alertController: AlertController,
    private platform: Platform,
    private router: Router,
    private pageNavService: PageNavigationService
  ) {}

  async getFamilyMembers() {
    this.isLoading = true;
    this.user = this.storageService.get('user');
    const getPatientsURL = '/familyMember/?userId=' + this.user.id;

    try {
      const familyMembers: any = await this.httpService.getInBackground(getPatientsURL, true, true); // Skip family member filtering for family member list API
      // // // console.log('All family members', familyMembers);
      if (familyMembers) {
        this.familyMembers = familyMembers;
      }
    } catch (error: any) {
      // // console.error('Fetching Error', error);
      this.utilityService.presentAlert('Error!', error?.message || 'Failed to load family members');
    } finally {
      this.isLoading = false;
    }
  }

  ionViewWillEnter() {
    this.navService.pageChange('Family Members');
    this.familyMembers = [];
    this.getFamilyMembers();

    // Set up back button handling with automatic cleanup
    this.pageNavService.setupBackButton('/family-member-list', () => {
      this.router.navigate(['home']);
    });
    this.pageNavService.setupBackButton('/home/profiles', () => {
      this.router.navigate(['home']);
    });
  }

  ngOnInit() {
    this.user = this.storageService.get('user');
    this.navService.pageChange('Family Members');
    if (this.user && this.user.phone) {
      this.phone = this.user.phone;
      // // // console.log(this.phone);
    }

    this.getFamilyMembers();
  }

  async deleteFamilyMember(patient: any) {
    const alert = await this.alertController.create({
      header: 'Confirm Deletion',
      message: `Are you sure you want to delete ${
        patient.fullName || 'this family member'
      }?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          role: 'confirm',
          handler: async () => {
            try {
              const deletePatientURL = '/familyMember/' + patient._id;
              await this.httpService.delete(deletePatientURL);

              // Remove from local array
              this.familyMembers = this.familyMembers.filter(
                (member: any) => member._id !== patient._id
              );

              this.utilityService.presentToast(
                'Family member deleted successfully',
                2000
              );
              this.router.navigate(['/home/profiles']);
            } catch (error: any) {
              // // console.error('Deletion Error', error);
              this.utilityService.presentAlert(
                'Deletion Failed',
                error.message
              );
            }
          },
        },
      ],
    });

    await alert.present();
  }

  navigateToPage(selectedFamilyMember: any): void {
    const navigationExtras: NavigationExtras = {
      state: {
        familyMember: selectedFamilyMember,
      },
    };

    this.router.navigate(['/home/family-member-form'], navigationExtras);
  }

  navigateToProfile(selectedFamilyMember: any, event: Event): void {
    // Only navigate if clicking on the card itself, not on action buttons
    if ((event.target as HTMLElement).closest('.actions-section')) {
      return;
    }
    this.navigateToPage(selectedFamilyMember);
  }

  hasPhoto(member: any): boolean {
    return !!member && !!(member.profilePicture || member.photo);
  }

  getProfileImage(member: any): string | null {
    if (!this.hasPhoto(member)) {
      return null;
    }

    return member.profilePicture || member.photo;
  }

  getInitials(fullName: string): string {
    if (!fullName) return '?';

    const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }

    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }

  getAvatarColor(fullName: string): string {
    const colors = [
      '#8B9DC3', '#A8C3A7', '#D4B483', '#C4A5A5', '#B8A8D4',
      '#9CC5C4', '#C8A8C8', '#B8D4A3', '#9B9B9B', '#B5A08A',
      '#A5B49A', '#C4A5A5', '#A08AC4', '#8AC4B8', '#D4A8A8'
    ];

    if (!fullName) return colors[0];

    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }

  getGenderBadgeClass(gender: string): string {
    switch (gender?.toLowerCase()) {
      case 'male':
        return 'gender-male';
      case 'female':
        return 'gender-female';
      case 'others':
        return 'gender-others';
      default:
        return 'gender-default';
    }
  }

  getGenderDisplayText(gender: string): string {
    if (!gender) return '';
    return gender;
  }

  formatDate(dateString: string | Date): string {
    if (!dateString) {
      return '';
    }
    
    try {
      let date: Date;
      
      // Check if it's already a Date object
      if (dateString instanceof Date) {
        date = dateString;
      } else {
        // Handle different string formats
        let dateStr = dateString.toString().trim();
        
        // Try parsing ISO format first
        if (dateStr.includes('T') || dateStr.includes('-')) {
          date = new Date(dateStr);
        } 
        // Try DD/MM/YYYY format
        else if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const part1 = parseInt(parts[0]);
            const part2 = parseInt(parts[1]);
            const part3 = parseInt(parts[2]);
            
            // Determine the year (should be the largest number or 4 digits)
            let year: number, month: number, day: number;
            
            if (part3 > 31) {
              // Third part is year (YYYY format)
              year = part3;
              // If first part > 12, assume DD/MM/YYYY
              if (part1 > 12) {
                day = part1;
                month = part2;
              } else if (part2 > 12) {
                // MM/DD/YYYY
                month = part1;
                day = part2;
              } else {
                // Ambiguous - default to DD/MM/YYYY for international format
                day = part1;
                month = part2;
              }
            } else {
              // Two digit year - assume YY/MM/DD or DD/MM/YY
              if (part1 > 31) {
                year = 2000 + part1;
                month = part2;
                day = part3;
              } else {
                year = 2000 + part3;
                day = part1;
                month = part2;
              }
            }
            
            date = new Date(year, month - 1, day); // month is 0-indexed in JS
          } else {
            date = new Date(dateStr);
          }
        } 
        else {
          date = new Date(dateStr);
        }
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        // // console.warn('Invalid date after parsing:', dateString, 'Parsed as:', date);
        return '';
      }
      
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      // // console.warn('Error formatting date:', dateString, error);
      return '';
    }
  }

  calculateAge(dateString: string | Date): number | null {
    if (!dateString) return null;
    
    try {
      let birthDate: Date;
      
      if (dateString instanceof Date) {
        birthDate = dateString;
      } else {
        // Use the same parsing logic as formatDate
        let dateStr = dateString.toString().trim();
        
        // Try parsing ISO format first
        if (dateStr.includes('T') || dateStr.includes('-')) {
          birthDate = new Date(dateStr);
        } 
        // Try DD/MM/YYYY format
        else if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const part1 = parseInt(parts[0]);
            const part2 = parseInt(parts[1]);
            const part3 = parseInt(parts[2]);
            
            // Determine the year (should be the largest number or 4 digits)
            let year: number, month: number, day: number;
            
            if (part3 > 31) {
              // Third part is year (YYYY format)
              year = part3;
              // If first part > 12, assume DD/MM/YYYY
              if (part1 > 12) {
                day = part1;
                month = part2;
              } else if (part2 > 12) {
                // MM/DD/YYYY
                month = part1;
                day = part2;
              } else {
                // Ambiguous - default to DD/MM/YYYY for international format
                day = part1;
                month = part2;
              }
            } else {
              // Two digit year - assume YY/MM/DD or DD/MM/YY
              if (part1 > 31) {
                year = 2000 + part1;
                month = part2;
                day = part3;
              } else {
                year = 2000 + part3;
                day = part1;
                month = part2;
              }
            }
            
            birthDate = new Date(year, month - 1, day); // month is 0-indexed in JS
          } else {
            birthDate = new Date(dateStr);
          }
        } 
        else {
          birthDate = new Date(dateStr);
        }
      }
      
      // Check if date is valid
      if (isNaN(birthDate.getTime())) {
        return null;
      }
      
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust age if birthday hasn't occurred this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age >= 0 ? age : null;
    } catch (error) {
      // // console.warn('Error calculating age:', dateString, error);
      return null;
    }
  }

  getAgeText(dateString: string | Date): string {
    const age = this.calculateAge(dateString);
    return age !== null ? `${age} years` : '';
  }

  getFormattedDateWithAge(dateString: string | Date): string {
    const formattedDate = this.formatDate(dateString);
    const age = this.calculateAge(dateString);
    
    if (!formattedDate) return '';
    
    if (age !== null) {
      return `${formattedDate} • ${age} years`;
    }
    
    return formattedDate;
  }

  ngOnDestroy() {
    // Clean up back button handlers
    this.pageNavService.cleanupBackButton('/family-member-list');
    this.pageNavService.cleanupBackButton('/home/profiles');
  }
}
