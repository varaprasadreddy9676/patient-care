import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpService } from '../http/http.service';
import { StorageService } from '../storage/storage.service';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private user: any;
  private appointmentsSubject = new BehaviorSubject<any[]>([]);
  appointments$ = this.appointmentsSubject.asObservable();

  constructor(
    private httpService: HttpService,
    private storageService: StorageService
  ) {
    this.initUser();
  }

  private initUser(): void {
    this.user = this.storageService.get('user');
    if (!this.user) {
      // // console.warn('User not found in storage');
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  }

  async getTodaysAppointments(): Promise<void> {

    if (!this.user?.id) {
      this.initUser();
      if (!this.user?.id) {
        throw new Error('User not found');
      }
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const formattedDate = this.formatDate(startOfToday);

    const getAppointmentURL = `/appointment?userId=${this.user.id}&appointmentDate__gte=${formattedDate}&status__equals=SCHEDULED`;

    try {
      // // // console.log('Getting today\'s appointments...');

      const appointments: any = await this.httpService.get(getAppointmentURL);
      // // // console.log('Received appointments:', appointments);

      this.appointmentsSubject.next(appointments || []);
      // // // console.log('Appointments subject updated');

    } catch (error) {
      // // console.error('Error fetching appointments:', error);
      this.appointmentsSubject.next([]);
      throw error;
    }
  }

  async refreshAppointments(): Promise<void> {
    // // // console.log('Refreshing appointments...');
    try {
      await this.getTodaysAppointments();
      // // // console.log('Appointments refreshed successfully');
    } catch (error) {
      // // console.error('Error refreshing appointments:', error);
      throw error;
    }
  }

  // Optional: Method to update user if it changes during runtime
  updateUser(user: any): void {
    this.user = user;
  }
}
