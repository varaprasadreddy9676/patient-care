import { UtilityService } from './../../../services/utility/utility.service';
import { HttpService } from './../../../services/http/http.service';
import { Router } from '@angular/router';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';
import {
  NativeDateAdapter,
  DateAdapter,
  MAT_DATE_FORMATS,
  MatOption,
} from '@angular/material/core';
import { formatDate, CommonModule, NgFor, NgIf } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';
import { IonicModule } from '@ionic/angular';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { FormsModule } from '@angular/forms';
import {
  MatFormField,
  MatLabel,
  MatError,
  MatSuffix,
} from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatInput } from '@angular/material/input';
import {
  MatDatepickerInput,
  MatDatepickerToggle,
  MatDatepicker,
} from '@angular/material/datepicker';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatCheckbox } from '@angular/material/checkbox';
// import { FilterPipe } from '../appointment-list/appointment-list.page';

@Pipe({
  name: 'filter',
  // pure: false,
  standalone: true,
})
export class FilterUnique implements PipeTransform {
  transform(value: any): any {
    if (value !== undefined && value !== null) {
      return _.uniqBy(value, 'specialityName');
    }
    return value;
  }
}

export const PICK_FORMATS = {
  parse: { dateInput: { month: 'numeric', year: 'numeric', day: 'numeric' } },
  display: {
    dateInput: 'input',
    monthYearLabel: { year: 'numeric', month: 'numeric' },
    dateA11yLabel: { year: 'numeric', month: 'numeric', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'numeric' },
  },
};

export class PickDateAdapter extends NativeDateAdapter {
  // tslint:disable-next-line:ban-types
  override format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'input') {
      return formatDate(date, 'dd/MM/yyyy', this.locale);
    } else {
      return date.toDateString();
    }
  }
}

interface TimeSlotEvening {
  time: any;
}

interface TimeSlotNight {
  time: any;
}

interface TimeSlotAfternoon {
  time: any;
}

interface TimeSlotMorning {
  time: any;
}

@Component({
  selector: 'app-appointment-modification',
  templateUrl: './appointment-modification.page.html',
  styleUrls: ['./appointment-modification.page.scss'],
  providers: [
    { provide: DateAdapter, useClass: PickDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: PICK_FORMATS },
  ],
  standalone: true,

  imports: [
    IonicModule,
    CdkScrollable,
    MatDialogContent,
    FormsModule,
    MatFormField,
    MatLabel,
    MatSelect,
    NgFor,
    MatOption,
    NgIf,
    MatError,
    MatInput,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatSuffix,
    MatDatepicker,
    MatRadioGroup,
    MatRadioButton,
    MatCheckbox,
    MatDialogClose,
    FilterUnique,
    // FilterPipe
  ],
})
export class AppointmentModificationPage implements OnInit {
  minAppointmentDate;
  hospitals: string | any;
  specialityList: string | any;
  doctor: any;
  doctors: string | any;
  dateOfAppointment;
  hospital: any;
  timeSlotAfternoon: TimeSlotAfternoon[] = [];
  timeSlotMorning: TimeSlotMorning[] = [];
  timeSlotEvening: TimeSlotEvening[] = [];
  timeSlotNight: TimeSlotNight[] = [];
  timeSlot: any;
  timeOfAppointment: any;
  hospitalCode: string | undefined;
  doctorSlots = [];
  user: any;
  doctorId: any;
  doctorName: any;
  hospitalId: any;
  hospitalName: any;
  slots: undefined;
  timeSlotArray: any;
  isHiddenFees = true;
  fee: any;
  consultationType: any;
  consultationCode: any;
  videoConsultation;
  consultation;
  isVideo: boolean | Event | any;
  specialist: any;
  specialityCode: any;
  specialityName: any;
  doctorArray: any;
  gateWayKey: any;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    private data: any,
    private dialogRef: MatDialogRef<AppointmentModificationPage>,
    private utilityService: UtilityService,
    private httpService: HttpService,
    private router: Router
  ) {
    this.minAppointmentDate = new Date();
    this.getHospitals();
    // this.getDoctors();
    // // // console.log('Appointment', this.data.appointmentDetails);
    this.dateOfAppointment = this.data.appointmentDetails.appointmentDate;
    this.getTimeSlot();

    if (this.data.appointmentDetails.consultationCharge.code === 'VID_CONS') {
      this.videoConsultation = this.data.appointmentDetails.consultationCharge;
      // // // console.log('videoConsultation', this.videoConsultation);
    } else {
      this.consultation = this.data.appointmentDetails.consultationCharge;
    }
    // this.getConsultationFee();
    // this.getTime(this.data.appointmentDetails.appointmentTime);
    this.onChange(this.data.appointmentDetails.videoConsultation);

    let hospitalInfo = {
      code: this.data.appointmentDetails.hospital.code,
      _id: this.data.appointmentDetails.hospital.id,
      name: this.data.appointmentDetails.hospital.name,
      paymentGatewayDetails: this.data.appointmentDetails.paymentDetails,
    };
    this.getConsultationFee(
      this.data.appointmentDetails.doctorId,
      this.data.appointmentDetails.hospital.code
    );
    // this.getSpecialists(hospitalInfo);
    this.getDoctors(hospitalInfo);
  }

  async getHospitals() {
    const getHospitalURL = '/hospital/?active=true';

    await this.httpService
      .get(getHospitalURL)
      .then((datas) => {
        // // // console.log('hospitals', datas[0].code);
        if (datas !== null && datas !== undefined && datas !== '') {
          this.hospitals = datas;
          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < this.hospitals.length; i++) {
            if (
              this.hospitals[i].name ===
              this.data.appointmentDetails.hospitalName
            ) {
              this.hospital = this.hospitals[i];
            }
          }

          // // // console.log('hospital array : ', this.hospitals);
          return datas;
        }
      })
      .catch((error) => {
        // // // console.log('Error', error);
      });
  }

  async getSpecialists(hospital: {
    code: string | undefined;
    _id: any;
    name: any;
  }) {
    this.hospitalCode = hospital.code;
    this.hospitalId = hospital._id;
    this.hospitalName = hospital.name;
    // tslint:disable-next-line:no-unused-expression

    this.hospitalCode
      ? this.hospitalCode
      : this.data.appointmentDetails.hospital.code;
    // // // console.log('hospital code ', this.hospitalCode);
    const getspecialtyURL = '/speciality/?hospitalCode=' + this.hospitalCode;
    // // // console.log('Hospital code : ', this.hospitalCode);

    await this.httpService
      .get(getspecialtyURL)
      .then((specialty) => {
        // // // console.log('All specialty', specialty.data.specialities);
        if (specialty !== '') {
          this.specialityList = specialty.data.specialities;
        }

        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < this.specialityList.length; i++) {
          if (
            this.specialityList[i].specialityName ===
            this.data.appointmentDetails.specialityName
          ) {
            this.specialist = this.specialityList[i];
          }
        }

        // // // console.log('specialty array : ', this.specialityList);
      })
      .catch((error) => {
        // // // console.log('Fetching Error', error);
        this.utilityService.presentAlert(
          'Fetching Error',
          'No specialty found.'
        );
      });
  }

  async getDoctors(hospital: {
    code: any;
    _id: any;
    name: any;
    paymentGatewayDetails: any;
  }) {
    this.hospitalCode
      ? this.hospitalCode
      : this.data.appointmentDetails.hospital.code;
    this.hospitalCode = hospital.code;
    this.hospitalId = hospital._id;
    this.hospitalName = hospital.name;
    this.gateWayKey = hospital.paymentGatewayDetails.gatewayKey;
    // this.specialityCode = specialityCode;
    // this.specialityName = specialityName;
    // this.getFamilyMemberHospitalAccount();

    const getDoctorURL = '/doctor/?hospitalCode=' + this.hospitalCode;

    await this.httpService
      .get(getDoctorURL)
      .then((doctors) => {
        // // // console.log('doctors', doctors.data.doctors);
        if (doctors) {
          this.doctors = doctors.data.doctors.slice(0);
          this.doctorArray = doctors.data.doctors.slice(0);

          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < this.doctors.length; i++) {
            if (
              this.doctors[i].specialityName ===
              this.data.appointmentDetails.specialityName
            ) {
              this.specialist = this.doctors[i];
              break;
            }
          }

          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < this.doctorArray.length; i++) {
            if (
              this.doctorArray[i].doctorName ===
              this.data.appointmentDetails.doctorName
            ) {
              this.doctor = this.doctorArray[i];
              break;
            }
          }
        }
      })
      .catch((error) => {
        // // // console.log('Error', error);
      });
  }

  getDoctorsArray(specialityCode: any, specialityName: any) {
    this.doctorArray.length = 0;
    this.specialityCode = specialityCode;
    this.specialityName = specialityName;

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < this.doctors.length; i++) {
      if (specialityCode === this.doctors[i].specialityCode) {
        this.doctorArray.push(this.doctors[i]);
      }
    }

    // // // console.log('selected doctor', this.doctors);
    // // // console.log('selected doctor array', this.doctorArray);
  }

  async getConsultationFee(doctorId: string, hospitalCode: string | undefined) {
    // tslint:disable-next-line:max-line-length
    const getDoctorURL =
      '/doctor/?id=' + doctorId + '&hospitalCode=' + hospitalCode;

    await this.httpService
      .get(getDoctorURL)
      .then((consultationFee) => {

        if (consultationFee) {
          this.consultation = consultationFee.data.consultationCharge;
          this.videoConsultation = consultationFee.data.videoConsultationCharge;

        }
      })
      .catch((error) => {
        // // console.error('Error', error);
      });
  }

  getCurrentDoctor(doctor: { doctorId: any; doctorName: any }) {
    this.doctorId = doctor.doctorId;
    this.doctorName = doctor.doctorName;
    this.doctorId ? this.doctorId : this.data.appointmentDetails.doctorId;
    this.hospitalCode
      ? this.hospitalCode
      : this.data.appointmentDetails.hospital.code;
    this.getConsultationFee(this.doctorId, this.hospitalCode);
    // // // console.log('current doctorName ', this.doctorName);
    this.dateOfAppointment = null;
    this.timeOfAppointment = null;
    this.isVideo = false;
    this.onChange(this.isVideo);
    this.fee = null;
    this.slots = undefined;
  }

  async getTimeSlot() {
    // // // // console.log(doa);
    this.slots = undefined;
    this.timeOfAppointment = null;

    this.timeSlotEvening.length = 0;
    this.timeSlotMorning.length = 0;
    this.timeSlotAfternoon.length = 0;
    this.timeSlotNight.length = 0;

    // tslint:disable-next-line:max-line-length
    const getTimeSlotURL =
      '/appointment/slot/?hospitalCode=' +
      this.data.appointmentDetails.hospital.code +
      '&doctorId=' +
      this.data.appointmentDetails.doctorId +
      '&appointmentDate=' +
      this.utilityService.toISODateTime(new Date(this.dateOfAppointment));

    await this.httpService
      .get(getTimeSlotURL)
      .then((timeSlot: any) => {
        if (timeSlot != null) {
          if (timeSlot.data.Evening) {
            // tslint:disable-next-line: prefer-for-of
            for (let i = 0; i < timeSlot.data.Evening.length; i++) {
              if (timeSlot.data.Evening[i].available === true) {
                // // // console.log(timeSlot.data.Evening[i].available);
                // this.timeSlotEvening = timeSlot.data.Evening;
                this.timeSlotEvening.push(timeSlot.data.Evening[i]);
              }
            }

            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < this.timeSlotEvening.length; i++) {
              if (
                this.timeSlotEvening[i].time ===
                this.data.appointmentDetails.appointmentTime
              ) {
                this.timeOfAppointment = this.timeSlotEvening[i];
              }
            }
          }

          if (timeSlot.data.Night) {
            // tslint:disable-next-line: prefer-for-of
            for (let i = 0; i < timeSlot.data.Night.length; i++) {
              if (timeSlot.data.Night[i].available === true) {
                this.timeSlotNight = timeSlot.data.Night;
                this.timeSlotEvening.push(timeSlot.data.Night[i]);
              }
            }

            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < this.timeSlotNight.length; i++) {
              if (
                this.timeSlotNight[i].time ===
                this.data.appointmentDetails.appointmentTime
              ) {
                this.timeOfAppointment = this.timeSlotNight[i];
              }
            }
          }
          if (timeSlot.data.Afternoon) {
            // tslint:disable-next-line: prefer-for-of
            for (let i = 0; i < timeSlot.data.Afternoon.length; i++) {
              if (timeSlot.data.Afternoon[i].available === true) {
                // this.timeSlotAfternoon = timeSlot.data.Afternoon;
                this.timeSlotAfternoon.push(timeSlot.data.Afternoon[i]);
              }
            }

            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < this.timeSlotAfternoon.length; i++) {
              if (
                this.timeSlotAfternoon[i].time ===
                this.data.appointmentDetails.appointmentTime
              ) {
                this.timeOfAppointment = this.timeSlotAfternoon[i];
              }
            }
          }

          if (timeSlot.data.Morning) {
            // tslint:disable-next-line: prefer-for-of
            for (let i = 0; i < timeSlot.data.Morning.length; i++) {
              if (timeSlot.data.Morning[i].available === true) {
                this.timeSlotMorning = timeSlot.data.Morning;
                this.timeSlotMorning.push(timeSlot.data.Morning[i]);
              }
            }

            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < this.timeSlotMorning.length; i++) {
              if (
                this.timeSlotMorning[i].time ===
                this.data.appointmentDetails.appointmentTime
              ) {
                this.timeOfAppointment = this.timeSlotMorning[i];
              }
            }
          }

          // // // console.log('Afternoon Time Slot', this.timeSlotAfternoon);
          // // // console.log('Morning Time Slot true', this.timeSlotMorning);
          // // // console.log('Morning Time Slot', timeSlot.data.Morning);
          // // // console.log('Evening Time Slot', this.timeSlotEvening);
        } else {
          this.utilityService.presentAlert(
            'No Slots Available',
            'Check for a different slot or date.'
          );
          this.timeSlot();
        }
      })
      .catch((error) => {
        // // console.error('Fetching Error', error);
        this.utilityService.presentAlert(
          'Try Again',
          'Time slots not fetched.'
        );
      });
  }

  getTime(timeSlot: (() => void) | undefined) {
    // // // console.log('appointment time', timeSlot);
    this.timeSlot = timeSlot;
    this.fee = this.consultation
      ? this.consultation.price
      : this.videoConsultation.price;
    // // // console.log(this.fee);
    this.consultationType = this.consultation
      ? this.consultation.chargeName
      : this.videoConsultation.chargeName;
    this.consultationCode = this.consultation
      ? this.consultation.code
      : this.videoConsultation.code;
    // this.isHiddenFees = false;
  }

  onChange($event: any) {
    this.isVideo = $event;
    // // // console.log(this.isVideo);

    if (this.isVideo === true) {
      this.fee = this.videoConsultation.price;
      // // // console.log(this.fee);
      this.consultationType = this.videoConsultation.name;
      this.consultationCode = this.videoConsultation.code;
    } else {
      this.getConsultationFee(
        this.data.appointmentDetails.doctorId,
        this.data.appointmentDetails.hospital.code
      );
      this.fee = this.consultation.price;
      // // // console.log(this.fee);
      this.consultationType = this.consultation.name;
      this.consultationCode = this.consultation.code;
    }
  }

  onRadioSelected(event: string) {
    // // // console.log(event);

    if (event === 'Morning') {
      this.timeSlotArray = [];
      this.timeSlotArray = this.timeSlotMorning;
      // // // console.log('If Morning', this.timeSlotArray);
    } else if (event === 'Afternoon') {
      this.timeSlotArray = [];
      this.timeSlotArray = this.timeSlotAfternoon;
      // // // console.log('If Afternoon', this.timeSlotArray);
    } else {
      this.timeSlotArray = [];
      this.timeSlotArray = this.timeSlotEvening;
      // // // console.log('If Evening', this.timeSlotArray);
    }
  }

  async editAppointment() {
    // // // console.log('time', this.timeSlot);
    if (this.timeSlot === undefined) {
      this.dialogRef.close();
      this.utilityService.presentAlert(
        'Invalid Input',
        'Enter a valid time slot.'
      );
    } else {
      //     consultationCharge: {chargeName: "Video Consultation Charges", price: "650", code: "VID_CONS"}
      this.data.appointmentDetails.consultationCharge = {
        chargeName: this.consultationType,
        price: this.fee,
        code: this.consultationCode,
      };

      this.data.appointmentDetails.hospital.code = this.hospitalCode;
      this.data.appointmentDetails.hospital.id = this.hospitalId;
      this.data.appointmentDetails.hospital.name = this.hospitalName;
      this.data.appointmentDetails.specialityCode = this.specialityCode;
      this.data.appointmentDetails.specialityName = this.specialityName;
      this.data.appointmentDetails.videoConsultation = this.isVideo;
      this.data.appointmentDetails.doctorName = this.doctorName;
      this.data.appointmentDetails.doctorId = this.doctorId;
      this.data.appointmentDetails.appointmentDate =
        this.utilityService.toISODateTime(new Date(this.dateOfAppointment));
      this.data.appointmentDetails.appointmentTime = this.timeSlot;
      // // // console.log('Edit Appointment', this.data.appointmentDetails);
      this.dialogRef.close();

      const rescheduleAppointmentURL =
        '/appointment/' + this.data.appointmentDetails._id;
      await this.httpService
        .put(rescheduleAppointmentURL, this.data.appointmentDetails)
        .then((rescheduleAppointment) => {
          // // // console.log('Updating : ', rescheduleAppointment);
          if (rescheduleAppointment != null) {
            this.router.navigate(['/home/appointment-list']);

          } else {
            this.utilityService.presentAlert(
              'Try Again',
              'Appointment not updated successfully.'
            );
          }
        })
        .catch((error) => {
          // // // console.log('Registration Error', error);
          this.utilityService.presentAlert(
            'Try Again',
            'Appointment not updated.'
          );
        });
    }
  }

  ngOnInit() {}
}
