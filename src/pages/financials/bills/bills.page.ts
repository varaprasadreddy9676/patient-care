import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { Platform, IonicModule } from '@ionic/angular';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { NgIf, NgFor, SlicePipe } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import * as moment from 'moment';
import { DateRangeFilterComponent } from '../../../app/date-range-filter/date-range-filter.component';
import { DateRangeFilter } from '../../../app/date-range-filter/date-range-filter.interface';
import { StorageService } from './../../../services/storage/storage.service';
import { HttpService } from './../../../services/http/http.service';
import { UtilityService } from './../../../services/utility/utility.service';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { GlobalFamilyMemberService, FamilyMember } from '../../../services/family-member/global-family-member.service';
import { Subscription } from 'rxjs';

interface UiBill {
  id: string;
  billNumber?: string;
  hospitalName: string;
  familyMemberName: string;
  billdate: string;      // raw from API (e.g., "30/07/2025")
  tranDate?: string;     // ISO if available e.g., "2025-07-30 14:26:32"
  netAmount: number;
  displayAmount: string; // formatted "₹500"
  status: 'Paid' | 'Pending' | 'Partial' | string;
  original: any;         // original raw bill object
}

@Component({
  selector: 'app-bills',
  templateUrl: './bills.page.html',
  styleUrls: ['./bills.page.scss'],
  standalone: true,
  imports: [IonicModule, MatTabGroup, MatTab, NgIf, NgFor, SlicePipe,DateRangeFilterComponent],
  animations: [
    trigger('slideToggle', [
      state('closed', style({
        height: '0',
        opacity: '0',
        overflow: 'hidden'
      })),
      state('open', style({
        height: '*',
        opacity: '1'
      })),
      transition('closed <=> open', [
        animate('200ms ease-in-out')
      ])
    ])
  ]
})
export class BillsPage implements OnInit, OnDestroy {
  user: any;

  // UI-friendly lists
  bill = {
    paidBills: [] as UiBill[],
    pendingBills: [] as UiBill[],
  };

  // 0 -> Paid, 1 -> Pending; default kept as Pending (1) like earlier code
  activeTabIndex: number = 1;

  isFilterOpen = false;
  startDate: any = '';
  endDate: any = '';
  currentFilter: 'week' | 'month' | 'quarter' | 'custom' | null = null;
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private storageService: StorageService,
    private httpService: HttpService,
    private platform: Platform,
    private utilityService: UtilityService,
    private navService: NavigationService,
    private globalFamilyMemberService: GlobalFamilyMemberService
  ) {
    this.navService.pageChange('Bills');
    this.user = this.storageService.get('user');
  }

  ionViewDidEnter() {
    this.navService.pageChange('Bills');
    this.initializeDefaultDateRange();
    this.bill.paidBills = [];
    this.bill.pendingBills = [];
    this.getBills();
  }

  initializeDefaultDateRange() {
    const today = moment();
    const threeMonthsAgo = moment().subtract(3, 'months').startOf('day');
    this.startDate = threeMonthsAgo.format('YYYY-MM-DD');
    this.endDate = today.format('YYYY-MM-DD');
  }

  onDateFilterChange(filter: DateRangeFilter) {
    this.startDate = filter.startDate;
    this.endDate = filter.endDate;
    this.getBills();
  }

  // Map a raw API bill object to our UiBill
  private mapToUiBill(raw: any): UiBill {
    // pick amount fields defensively
    const amountRaw = raw.netAmount ?? raw.patientAmount ?? raw.grossAmount ?? '0';
    const net = parseFloat(String(amountRaw)) || 0;
    const display = `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(net)}`;

    const status =
      raw.billStatus === 'FullyPaid' ? 'Paid'
      : (raw.billStatus === 'Confirmed' || raw.billStatus === 'partiallyPaid') ? 'Pending'
      : raw.billStatus || 'Pending';

    return {
      id: String(raw.id || raw.visitId || raw.billNumber || Math.random().toString(36).slice(2)),
      billNumber: raw.billNumber,
      hospitalName: raw.entityName || raw.hospitalName || raw.unitName || '',
      familyMemberName: raw.patientName || raw.familyMemberName || '',
      billdate: raw.billdate || raw.visitDate || raw.tranDate || '',
      tranDate: raw.tranDate,
      netAmount: net,
      displayAmount: display,
      status,
      original: raw
    };
  }

  // Fetch and prepare bills
  async getBills() {
    this.user = this.storageService.get('user');
    // Compose API URL exactly like your backend expects
    const url = `/bill/?userId=${this.user.id}&fromDate=${this.startDate}&toDate=${this.endDate}`;

    try {
      const response: any = await this.httpService.getInBackground(url, true);

      // reset lists
      this.bill.paidBills = [];
      this.bill.pendingBills = [];

      if (!Array.isArray(response)) {
        // handle unexpected response
        // // console.warn('getBills: unexpected response shape', response);
        return;
      }

      for (const item of response) {
        // item can have hospitalName, familyMemberName, bill: []
        const parentFamily = item.familyMemberName;
        const parentHospital = item.hospitalName;
        const parentPaymentDetails = item.paymentDetails;

        const billsArr = Array.isArray(item.bill) ? item.bill : [];

        // If hospital-level object has zero bills, skip (UI shows empty state)
        billsArr.forEach((rawBill: any) => {
          // attach parent-level info if missing in bill object
          if (!rawBill.familyMemberName && parentFamily) rawBill.familyMemberName = parentFamily;
          if (!rawBill.hospitalName && parentHospital) rawBill.hospitalName = parentHospital;
          if (!rawBill.paymentDetails && parentPaymentDetails) rawBill.paymentDetails = parentPaymentDetails;

          const ui = this.mapToUiBill(rawBill);

          if (ui.status === 'Paid') {
            this.bill.paidBills.push(ui);
          } else if (ui.status === 'Pending' || ui.status === 'Partial') {
            this.bill.pendingBills.push(ui);
          } else {
            // fallback: treat unknown statuses as Pending
            this.bill.pendingBills.push(ui);
          }
        });
      }

      // Sorting: newest first using tranDate or parsing dd/mm/yyyy billdate
      const getEpoch = (b: UiBill) => {
        if (b.tranDate) {
          return moment(b.tranDate, ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601]).valueOf();
        }
        // try parse billdate like "30/07/2025"
        const m = moment(b.billdate, ['DD/MM/YYYY','DD-MM-YYYY','YYYY-MM-DD'], true);
        if (m.isValid()) return m.valueOf();
        return 0;
      };

      this.bill.paidBills.sort((a, b) => getEpoch(b) - getEpoch(a));
      this.bill.pendingBills.sort((a, b) => getEpoch(b) - getEpoch(a));

      // update aria-live region or any counts if required by template
    } catch (error) {
      // // console.error('Error fetching bills:', error);
    }
  }

  // Navigate to bill details / receipt
  viewReceipt(uiBill: UiBill) {
    const navigationExtras: NavigationExtras = {
      state: { bill: uiBill.original }
    };
    this.router.navigate(['/home/bill-details'], navigationExtras);
  }

  // Display helpers for template
  formatDateForHeader(billdate: string, tranDate?: string): string {
    // prefer tranDate if available
    if (tranDate && moment(tranDate, ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601], true).isValid()) {
      return moment(tranDate).format('MMM DD, YYYY');
    }
    const m = moment(billdate, ['DD/MM/YYYY','DD-MM-YYYY','YYYY-MM-DD'], true);
    return m.isValid() ? m.format('MMM DD, YYYY') : billdate;
  }
// inside BillsPage class
trackByBillId(index: number, item: UiBill) {
  return item.id;
}

  getRelativeDate(billdate: string, tranDate?: string): string {
    const m = tranDate ? moment(tranDate) : moment(billdate, ['DD/MM/YYYY','DD-MM-YYYY','YYYY-MM-DD']);
    if (!m.isValid()) return '';
    const daysDiff = moment().diff(m, 'days');
    if (daysDiff === 0) return 'Today';
    if (daysDiff === 1) return 'Yesterday';
    if (daysDiff < 7) return `${daysDiff} days ago`;
    return m.format('MMM DD');
  }

  // total amounts for top summary if wanted
  calculateTotalAmount(bills: UiBill[]): string {
    const total = bills.reduce((sum, b) => sum + (b.netAmount || 0), 0);
    return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(total)}`;
  }

  // New date formatting methods for the redesigned UI
  formatDay(billdate: string, tranDate?: string): string {
    const m = this.getMomentDate(billdate, tranDate);
    return m.isValid() ? m.format('DD') : '00';
  }

  formatMonth(billdate: string, tranDate?: string): string {
    const m = this.getMomentDate(billdate, tranDate);
    return m.isValid() ? m.format('MMM') : '';
  }

  formatYear(billdate: string, tranDate?: string): string {
    const m = this.getMomentDate(billdate, tranDate);
    return m.isValid() ? m.format('YYYY') : '';
  }

  private getMomentDate(billdate: string, tranDate?: string): moment.Moment {
    if (tranDate && moment(tranDate, ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601], true).isValid()) {
      return moment(tranDate);
    }
    return moment(billdate, ['DD/MM/YYYY','DD-MM-YYYY','YYYY-MM-DD'], true);
  }

  // Get service type from bill data
  getServiceType(bill: UiBill): string {
    // Extract service type from the original bill data
    const original = bill.original;
    if (original.serviceType) {
      return original.serviceType;
    }
    if (original.visitType) {
      return original.visitType;
    }
    if (original.category) {
      return original.category;
    }
    // Default service types based on common patterns
    return 'Consultation'; // Default fallback
  }

  ngOnInit() {
    // Subscribe to family member changes to refresh bills data
    let isFirstEmission = true;

    this.subscriptions.add(
      this.globalFamilyMemberService.selectedFamilyMember$.subscribe(
        (member: FamilyMember | null) => {
          // Only reload if this is not the first emission
          // First emission happens on init, data will be loaded by ionViewDidEnter
          if (!isFirstEmission && member) {
            // Reload bills for the newly selected family member
            this.bill.paidBills = [];
            this.bill.pendingBills = [];
            this.getBills();
          }
          isFirstEmission = false;
        }
      )
    );
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.unsubscribe();
  }
}
