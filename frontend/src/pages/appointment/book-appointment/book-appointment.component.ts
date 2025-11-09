import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-book-appointment',
  templateUrl: './book-appointment.component.html',
  styleUrls: ['./book-appointment.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink, RouterLinkActive],
})
export class BookAppointmentComponent implements OnInit {
  constructor(private router: Router) {}

  goToAppointment() {
    this.router.navigate(['/home/appointment-list']);
  }

  ngOnInit() {}
}