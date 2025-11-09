import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { trigger, state, style, transition, animate } from '@angular/animations';
import * as moment from 'moment';
import { DateRangeFilter, QuickFilterOption } from './date-range-filter.interface';

type FilterPeriod = 'week' | 'month' | 'quarter' | '6months' | '1year';

@Component({
  selector: 'app-date-range-filter',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './date-range-filter.component.html',
  styleUrls: ['./date-range-filter.component.scss'],
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
export class DateRangeFilterComponent implements OnInit {
  @Input() title: string = 'Date Range';
  @Input() initialFilter: DateRangeFilter | null = null;
  @Input() quickFilters: FilterPeriod[] = ['week', 'month', 'quarter', '6months', '1year'];
  @Output() filterChange = new EventEmitter<DateRangeFilter>();

  isFilterOpen = false;
  startDate: string | null = null;
  endDate: string | null = null;
  currentFilter: 'week' | 'month' | 'quarter' | '6months' | '1year' | 'custom' | null = null;

  private quickFilterOptions: Record<FilterPeriod, { label: string; value: FilterPeriod }> = {
    week: { label: '1 Week', value: 'week' },
    month: { label: '1 Month', value: 'month' },
    quarter: { label: '3 Months', value: 'quarter' },
    '6months': { label: '6 Months', value: '6months' },
    '1year': { label: '1 Year', value: '1year' }
  };

  get enabledQuickFilters(): { label: string; value: FilterPeriod }[] {
    return this.quickFilters.map(filter => this.quickFilterOptions[filter]);
  }

  ngOnInit() {
    if (this.initialFilter) {
      this.startDate = this.initialFilter.startDate;
      this.endDate = this.initialFilter.endDate;
      this.currentFilter = this.initialFilter.filterType;
    }
  }

  get formattedDateRange(): string {
    if (!this.startDate || !this.endDate) {
      return 'Last 3 months';
    }
    return `${moment(this.startDate).format('MMM D, YYYY')} - ${moment(this.endDate).format('MMM D, YYYY')}`;
  }

  toggleDateFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  updateStartDate(event: any): void {
    this.startDate = event.detail.value;
    this.currentFilter = 'custom';

    if (this.endDate && moment(this.endDate).isBefore(moment(this.startDate))) {
      this.endDate = this.startDate;
    }
  }

  updateEndDate(event: any): void {
    this.endDate = event.detail.value;
    this.currentFilter = 'custom';
  }

  setQuickFilter(period: FilterPeriod): void {
    const today = moment().startOf('day');

    switch (period) {
      case 'week':
        this.startDate = today.clone().subtract(7, 'days').format('YYYY-MM-DD');
        break;
      case 'month':
        this.startDate = today.clone().subtract(1, 'month').format('YYYY-MM-DD');
        break;
      case 'quarter':
        this.startDate = today.clone().subtract(3, 'months').format('YYYY-MM-DD');
        break;
      case '6months':
        this.startDate = today.clone().subtract(6, 'months').format('YYYY-MM-DD');
        break;
      case '1year':
        this.startDate = today.clone().subtract(1, 'year').format('YYYY-MM-DD');
        break;
    }

    this.endDate = today.format('YYYY-MM-DD');
    this.currentFilter = period;
  }

  clearFilter(): void {
    this.startDate = null;
    this.endDate = null;
    this.currentFilter = null;
    this.emitChange();
  }

  applyDateFilter(): void {
    this.emitChange();
    this.isFilterOpen = false;
  }

  private emitChange(): void {
    this.filterChange.emit({
      startDate: this.startDate,
      endDate: this.endDate,
      filterType: this.currentFilter
    });
  }
}
