import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { GlobalFamilyMemberService, FamilyMember } from '../../services/family-member/global-family-member.service';
import { UtilityService } from '../../services/utility/utility.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-family-member-selector',
  templateUrl: './family-member-selector.component.html',
  styleUrls: ['./family-member-selector.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  animations: []
})
export class FamilyMemberSelectorComponent implements OnInit, OnDestroy {
  isOpen = false;
  familyMembers: FamilyMember[] = [];
  selectedMemberId: string | null = null;

  private subscriptions = new Subscription();

  constructor(
    private globalFamilyMemberService: GlobalFamilyMemberService,
    private utilityService: UtilityService
  ) {}

  ngOnInit() {
    // Listen for selection requirement
    this.subscriptions.add(
      this.globalFamilyMemberService.isSelectionRequired$.subscribe(required => {
        if (required) {
          this.openModal();
        }
      })
    );

    // Load family members
    this.subscriptions.add(
      this.globalFamilyMemberService.familyMembers$.subscribe(members => {
        this.familyMembers = members || [];
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  openModal() {
    this.isOpen = true;
    // Get the latest family members from the service
    try {
      this.familyMembers = this.globalFamilyMemberService.getFamilyMembers();
      // // // console.log('Family Member Selector - Using pre-loaded family members:', this.familyMembers.length);

      // If no family members are loaded, wait a moment and try again
      if (this.familyMembers.length === 0) {
        setTimeout(() => {
          this.familyMembers = this.globalFamilyMemberService.getFamilyMembers();
          // // // console.log('Family Member Selector - Retry: family members:', this.familyMembers.length);
        }, 200);
      }
    } catch (error) {
      console.error('Error loading family members:', error);
      this.familyMembers = []; // Fail gracefully with empty array
    }
  }

  closeModal() {
    this.isOpen = false;
  }

  async selectMember(member: FamilyMember) {
    // Prevent multiple selections
    if (this.selectedMemberId) return;

    // Validate member object
    if (!member) {
      console.error('Cannot select null or undefined member');
      return;
    }

    const memberId = this.getMemberId(member);
    this.selectedMemberId = memberId;

    // Simple selection with delay for visual feedback
    setTimeout(() => {
      try {
        this.globalFamilyMemberService.selectFamilyMember(member);

        // Mark first-time selection as complete if this is the first time
        try {
          if (this.globalFamilyMemberService.requiresFirstTimeSelection()) {
            this.globalFamilyMemberService.setFirstTimeSelectionComplete();
          }
        } catch (error) {
          console.error('Error checking/setting first-time selection:', error);
        }

        // Show success toast
        this.utilityService.presentToast(
          `${member.fullName} selected as active family member`,
          2000
        );

        this.closeModal();
        this.resetSelectionState();
      } catch (error) {
        console.error('Error selecting family member:', error);
        this.resetSelectionState();
        this.utilityService.presentToast(
          'Failed to select family member',
          2000
        );
      }
    }, 300);
  }

  private resetSelectionState() {
    this.selectedMemberId = null;
  }

  hasPhoto(member: FamilyMember | null): boolean {
    return !!member && !!(member.profilePicture || (member as any)?.photo);
  }

  getPhoto(member: FamilyMember | null): string {
    if (!this.hasPhoto(member)) {
      return '';
    }

    return member!.profilePicture || (member as any).photo;
  }

  getInitials(fullName: string): string {
    return this.globalFamilyMemberService.getInitials(fullName);
  }

  onBackdropClick(event: Event) {
    // Don't allow closing if first-time selection is required
    try {
      if (!this.globalFamilyMemberService.requiresFirstTimeSelection()) {
        this.closeModal();
      }
    } catch (error) {
      console.error('Error in backdrop click handler:', error);
      // If there's an error, allow closing the modal as a fallback
      this.closeModal();
    }
  }

  // Track by function for ngFor optimization
  trackByMemberId = (index: number, member: FamilyMember): string => {
    return member ? this.getMemberId(member) : index.toString();
  }

  // Get the correct ID from member (handles different ID field names)
  // Prioritize _id (document ID) to match GlobalFamilyMemberService
  getMemberId(member: FamilyMember): string {
    if (!member) return 'unknown';
    return member._id || member.familyMemberId || member.id || 'unknown';
  }

  // Check if first-time selection is required
  isFirstTimeSelectionRequired(): boolean {
    try {
      return this.globalFamilyMemberService.requiresFirstTimeSelection();
    } catch (error) {
      console.error('Error checking first-time selection requirement:', error);
      return false; // Fail gracefully
    }
  }

}
