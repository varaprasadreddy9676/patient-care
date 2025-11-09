import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

export interface PrescriptionItem {
  id: string;
  name: string;          // e.g., "CLOPIDOGREL 75 mg"
  dose: string;          // "OD (1–0–0)"
  frequency: string;     // "One time, in the morning" (patient-friendly)
  durationText: string;  // "6 months" | "Ended Dec 17, 2024"
  qty?: string;          // "Qty: 180"
  route?: string;        // "Oral", "Injection", etc.
  timeOfDay?: 'Morning' | 'Evening' | 'Night';
  remarks?: string;      // Special instructions like "From Day3 to Day7 of cycle"
  status: 'active' | 'expired';
}

@Component({
  selector: 'rx-item-card',
  templateUrl: './rx-item-card.component.html',
  styleUrls: ['./rx-item-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class RxItemCardComponent {
  @Input() item!: PrescriptionItem;
}
