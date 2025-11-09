import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class AlertsComponent implements OnInit {
  isLoading = true;

  constructor() {}

  ngOnInit() {
    setTimeout(() => {
      this.isLoading = false;
    }, 2000);
  }
}