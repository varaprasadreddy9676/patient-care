import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from '../storage/storage.service';

export interface FamilyMember {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  relationshipToUser: string;
  relation?: string;
  profilePicture?: string;
  isActive: boolean;
  _id?: string;
  familyMemberId?: string;
  phone?: string;
  dob?: string;
  userId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GlobalFamilyMemberService {
  private readonly STORAGE_KEY = 'selectedFamilyMember';
  private readonly FAMILY_MEMBERS_KEY = 'familyMembers';
  private readonly FIRST_TIME_SELECTION_KEY = 'familyMemberFirstTimeSelection';

  private selectedFamilyMember = new BehaviorSubject<FamilyMember | null>(null);
  private familyMembers = new BehaviorSubject<FamilyMember[]>([]);
  private isSelectionRequired = new BehaviorSubject<boolean>(false);
  private isLoading = new BehaviorSubject<boolean>(false);
  private isFirstTimeSelectionComplete = new BehaviorSubject<boolean>(false);

  selectedFamilyMember$ = this.selectedFamilyMember.asObservable();
  familyMembers$ = this.familyMembers.asObservable();
  isSelectionRequired$ = this.isSelectionRequired.asObservable();
  isLoading$ = this.isLoading.asObservable();
  isFirstTimeSelectionComplete$ = this.isFirstTimeSelectionComplete.asObservable();

  constructor(private storageService: StorageService) {
    this.loadFromStorage();
  }

  upsertFamilyMember(member: FamilyMember): void {
    if (!member) {
      return;
    }

    const memberId = this.getMemberId(member);
    const currentMembers = this.familyMembers.value;
    // Ensure we have a valid array to work with
    const members = Array.isArray(currentMembers) ? [...currentMembers] : [];
    const existingIndex = members.findIndex(existing => this.getMemberId(existing) === memberId);

    if (existingIndex >= 0) {
      members[existingIndex] = member;
    } else {
      members.push(member);
    }

    this.familyMembers.next(members);
    this.storageService.set(this.FAMILY_MEMBERS_KEY, members, true);

    const selectedMember = this.selectedFamilyMember.value;
    if (selectedMember && this.getMemberId(selectedMember) === memberId) {
      this.selectedFamilyMember.next(member);
      this.saveToStorage();
    }
  }

  selectFamilyMember(member: FamilyMember | null): void {
    this.selectedFamilyMember.next(member);
    this.isSelectionRequired.next(false);
    this.saveToStorage();
  }

  loadFamilyMembers(members: FamilyMember[]): void {
    // Ensure members is always an array, never null or undefined
    const validMembers = Array.isArray(members) ? members : [];

    this.familyMembers.next(validMembers);
    this.storageService.set(this.FAMILY_MEMBERS_KEY, validMembers, true);

    // Wait a tick to ensure all subscribers have received the family members data
    setTimeout(() => {
      // Auto-select primary user (Self) if no member is currently selected
      if (validMembers.length > 0 && !this.getSelectedMember()) {
        this.autoSelectPrimaryUser(validMembers);
      }

      // Only show popup if no primary user found and first-time selection not complete
      const isFirstTimeComplete = this.isFirstTimeSelectionCompleted();
      const hasSelectedMember = this.getSelectedMember();

      if (validMembers.length > 0 && !hasSelectedMember && !isFirstTimeComplete) {
        // Double-check that family members are actually loaded before requiring selection
        const currentMembers = this.getFamilyMembers();
        if (currentMembers.length > 0) {
          this.requireSelection();
        }
      }
    }, 100); // Small delay to ensure data propagation
  }

  clearSelection(): void {
    this.selectedFamilyMember.next(null);
    this.storageService.remove(this.STORAGE_KEY);
  }

  clearFirstTimeSelectionState(): void {
    this.isFirstTimeSelectionComplete.next(false);
    this.storageService.remove(this.FIRST_TIME_SELECTION_KEY);
    // // // console.log('First-time selection state cleared');
  }

  /**
   * Reset all family member selections and states - useful for testing or logout
   */
  resetAllSelections(): void {
    this.clearSelection();
    this.clearFirstTimeSelectionState();
    this.familyMembers.next([]);
    this.storageService.remove(this.FAMILY_MEMBERS_KEY);
    // // // console.log('All family member selections and state reset');
  }

  getSelectedMember(): FamilyMember | null {
    return this.selectedFamilyMember.value;
  }

  getFamilyMembers(): FamilyMember[] {
    const members = this.familyMembers.value;
    // Ensure we always return an array, never null or undefined
    return Array.isArray(members) ? members : [];
  }

  requireSelection(): void {
    this.isSelectionRequired.next(true);
  }

  hasSelectedMember(): boolean {
    return this.selectedFamilyMember.value !== null;
  }

  setLoading(loading: boolean): void {
    this.isLoading.next(loading);
  }

  setFirstTimeSelectionComplete(): void {
    this.isFirstTimeSelectionComplete.next(true);
    this.storageService.set(this.FIRST_TIME_SELECTION_KEY, true, true);
  }

  isFirstTimeSelectionCompleted(): boolean {
    const storedValue = this.storageService.get(this.FIRST_TIME_SELECTION_KEY);
    return storedValue === true;
  }

  requiresFirstTimeSelection(): boolean {
    const members = this.familyMembers.value;
    // Add null/undefined check to prevent errors
    if (!members || !Array.isArray(members)) {
      return false;
    }
    return members.length > 0 && !this.isFirstTimeSelectionCompleted();
  }

  getInitials(fullName: string): string {
    if (!fullName) return '?';

    const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }

    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }

  findMemberById(id: string): FamilyMember | undefined {
    const members = this.familyMembers.value;
    // Ensure we have a valid array before calling find
    if (!members || !Array.isArray(members)) {
      return undefined;
    }
    return members.find(member =>
      this.getMemberId(member) === id
    );
  }

  getMemberId(member: FamilyMember): string {
    // Prioritize _id (document ID) over userId for API calls
    // _id is the family member's document ID in the database
    // userId is the associated user ID (different from family member ID)
    return member._id || member.familyMemberId || member.userId || 'unknown';
  }

  /**
   * Automatically selects the logged-in user when family members are loaded
   * This prevents the popup from showing on login for the logged-in user
   */
  private autoSelectPrimaryUser(members: FamilyMember[]): void {
    // Get logged-in user from storage
    const loggedInUser = this.storageService.get('user');
    // // // console.log('=== AUTO-SELECT DEBUG ===');
    // // // console.log('Logged-in user from storage:', loggedInUser);
    // // // console.log('User ID available:', loggedInUser?.id || loggedInUser?._id || 'NONE');
    // // // console.log('Family members count:', members.length);

    if (!loggedInUser) {
      // // // console.log('❌ No logged-in user found in storage');
      return;
    }

    // Try multiple possible ID fields from logged-in user
    const userId = loggedInUser.id || loggedInUser._id || loggedInUser.userId;
    if (!userId) {
      // // // console.log('❌ No user ID found in logged-in user object');
      // // // console.log('Available fields:', Object.keys(loggedInUser));
      return;
    }

    // // // console.log('Looking for user ID:', userId);
    // // // console.log('Available family members:');
    members.forEach((member, index) => {
      // // // console.log(`  ${index + 1}. ${member.fullName} - userId: ${member.userId} - _id: ${member._id} - Match: ${member.userId === userId || member._id === userId}`);
    });

    // Find and select the logged-in user using multiple matching strategies
    let primaryUser = members.find(member => member.userId === userId);

    // If not found by userId, try matching by _id field
    if (!primaryUser) {
      primaryUser = members.find(member => member._id === userId);
    }

    // If still not found, try matching by familyMemberId field
    if (!primaryUser) {
      primaryUser = members.find(member => member.familyMemberId === userId);
    }

    // As a fallback, try to match by name similarity
    if (!primaryUser && loggedInUser.firstName && loggedInUser.lastName) {
      const fullName = `${loggedInUser.firstName} ${loggedInUser.lastName}`.toLowerCase().trim();
      primaryUser = members.find(member =>
        member.fullName && member.fullName.toLowerCase().trim() === fullName
      );
    }

    if (primaryUser) {
      // // // console.log('✅ Auto-selecting logged-in user:', primaryUser.fullName);
      this.selectedFamilyMember.next(primaryUser);
      this.saveToStorage();

      // Mark first-time selection as complete since we auto-selected primary user
      if (!this.isFirstTimeSelectionCompleted()) {
        this.setFirstTimeSelectionComplete();
      }
    } else {
      // // // console.log('❌ Logged-in user not found in family members list');
      // // // console.log('This might indicate a data consistency issue');
    }
    // // // console.log('=== END AUTO-SELECT DEBUG ===');
  }

  updateFamilyMember(updatedMember: FamilyMember): void {
    this.upsertFamilyMember(updatedMember);
  }

  private saveToStorage(): void {
    const selectedMember = this.selectedFamilyMember.value;
    if (selectedMember) {
      this.storageService.set(this.STORAGE_KEY, selectedMember, true);
    }
  }

  private loadFromStorage(): void {
    const selectedMember = this.storageService.get(this.STORAGE_KEY);
    const storedMembers = this.storageService.get(this.FAMILY_MEMBERS_KEY);
    const isFirstTimeComplete = this.storageService.get(this.FIRST_TIME_SELECTION_KEY) === true;

    // Ensure family members is always a valid array
    const familyMembers = Array.isArray(storedMembers) ? storedMembers : [];

    if (selectedMember) {
      this.selectedFamilyMember.next(selectedMember);
    }

    if (familyMembers.length > 0) {
      this.familyMembers.next(familyMembers);
    }

    this.isFirstTimeSelectionComplete.next(isFirstTimeComplete);
  }
}
