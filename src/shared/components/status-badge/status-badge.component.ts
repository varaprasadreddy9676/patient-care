import { Component, Input } from '@angular/core';

export type StatusType =
  | 'scheduled'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'no-show'
  | 'paid'
  | 'pending'
  | 'overdue'
  | 'partial'
  | 'refunded'
  | 'active'
  | 'inactive'
  | 'critical'
  | 'emergency'
  | 'normal'
  | 'abnormal'
  | 'draft'
  | 'finalized'
  | 'amended'
  | 'archived';

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss'],
})
export class StatusBadgeComponent {
  @Input() status: StatusType = 'pending';
  @Input() text?: string;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() position: 'left' | 'right' | 'center' = 'right';
  @Input() showIcon: boolean = true;

  constructor() {}

  get statusText(): string {
    if (this.text) return this.text;

    // Default text based on status type
    const statusTexts: Record<StatusType, string> = {
      'scheduled': 'Scheduled',
      'confirmed': 'Confirmed',
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'no-show': 'No Show',
      'paid': 'Paid',
      'pending': 'Pending',
      'overdue': 'Overdue',
      'partial': 'Partial',
      'refunded': 'Refunded',
      'active': 'Active',
      'inactive': 'Inactive',
      'critical': 'Critical',
      'emergency': 'Emergency',
      'normal': 'Normal',
      'abnormal': 'Abnormal',
      'draft': 'Draft',
      'finalized': 'Finalized',
      'amended': 'Amended',
      'archived': 'Archived'
    };

    return statusTexts[this.status] || 'Unknown';
  }

  get statusIcon(): string {
    const statusIcons: Record<StatusType, string> = {
      'scheduled': 'calendar-outline',
      'confirmed': 'checkmark-circle-outline',
      'in-progress': 'time-outline',
      'completed': 'checkmark-done-outline',
      'cancelled': 'close-circle-outline',
      'no-show': 'person-remove-outline',
      'paid': 'card-outline',
      'pending': 'time-outline',
      'overdue': 'warning-outline',
      'partial': 'pie-chart-outline',
      'refunded': 'swap-horizontal-outline',
      'active': 'checkmark-circle-outline',
      'inactive': 'pause-circle-outline',
      'critical': 'alert-circle-outline',
      'emergency': 'warning-outline',
      'normal': 'checkmark-circle-outline',
      'abnormal': 'warning-outline',
      'draft': 'document-text-outline',
      'finalized': 'checkmark-done-circle-outline',
      'amended': 'create-outline',
      'archived': 'archive-outline'
    };

    return statusIcons[this.status] || 'help-circle-outline';
  }

  get statusClass(): string {
    return `status-badge status-badge--${this.status} status-badge--${this.size}`;
  }

  get alignmentClass(): string {
    return `status-badge--align-${this.position}`;
  }
}