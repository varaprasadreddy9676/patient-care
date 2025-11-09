import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

export interface PrescriptionSummary {
  doctor: string;        // "Dr. Atmaram"
  date: string;          // "Feb 13, 2024"
  itemsCount: number;    // 2
  sheet: string;         // "Generic Case Sheet"
}

@Component({
  selector: 'rx-summary-card',
  templateUrl: './rx-summary-card.component.html',
  styleUrls: ['./rx-summary-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class RxSummaryCardComponent {
  @Input() summary!: PrescriptionSummary;
}
