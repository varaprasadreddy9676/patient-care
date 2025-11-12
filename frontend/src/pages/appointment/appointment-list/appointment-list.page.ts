import { DateService } from './../../../services/date/date.service';
import { StorageService } from './../../../services/storage/storage.service';
import { UtilityService } from './../../../services/utility/utility.service';
import { HttpService } from './../../../services/http/http.service';
import {
  Component,
  Injectable,
  OnInit,
  OnDestroy,
  Pipe,
  PipeTransform,
  ViewChild,
} from '@angular/core';
import {
  DateAdapter,
  NativeDateAdapter,
  MAT_DATE_FORMATS,
  MatOption,
  MatOptgroup,
} from '@angular/material/core';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import { MatSelect, MatSelectTrigger } from '@angular/material/select';
import { Router, NavigationExtras, ActivatedRoute } from '@angular/router';
import {
  LoadingController,
  NavController,
  Platform,
  IonicModule,
} from '@ionic/angular';
import { formatDate, NgIf, NgFor, NgClass, DatePipe, CommonModule } from '@angular/common';
import * as _ from 'lodash';
import { environment } from 'src/environments/environment';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { PageNavigationService } from 'src/services/navigation/page-navigation.service';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import {
  MatFormField,
  MatLabel,
  MatError,
  MatSuffix,
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
} from '@angular/material/form-field';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatInput } from '@angular/material/input';
import { FilterUnique } from '../appointment-modification/appointment-modification.page';
import { GlobalFamilyMemberService, FamilyMember as GlobalFamilyMember } from '../../../services/family-member/global-family-member.service';
import { Subscription } from 'rxjs';
import { BannerComponent } from 'src/shared/components/banner/banner.component';
// import { HttpErrorResponse } from '@angular/common/http';

@Pipe({
  name: 'filter',
  // pure: false,
  standalone: true,
})
export class FilterPipe implements PipeTransform {
  transform(value: any): any {
    if (value !== undefined && value !== null) {
      return _.uniqBy(value, 'specialityName');
    }
    return value;
  }
}

@Pipe({
  name: 'daysUntil',
  standalone: true,
})
export class DaysUntilPipe implements PipeTransform {
  transform(appointmentDate: string | Date): number {
    const today = new Date();
    const appointment = new Date(appointmentDate);
    const timeDiff = appointment.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  }
}

interface FamilyMember {
  dob: any;
  phone: string;
  _id: string;
  fullName: string;
}

interface Hospital {
  _id: string;
  name: string;
  cityName: string;
  paymentRequired: any;
}

interface User {
  phone: string;
  id: string;
  preference: {
    hospitalPreferences: Array<{ hospitalId: string }>;
  };
}

interface DoctorGroup {
  name: string;
  doctors: any;
}

interface Doctors {
  specialityName: any;
  specialityCode: number;
  doctorName: string;
  canDoVideoConsultation: any;
  doctorRegistrationNo: any;
}

interface DoctorArray {
  doctorName: string;
  canDoVideoConsultation: any;
  doctorRegistrationNo: any;
}

interface TimeSlotMorning {
  time: string;
}

interface TimeSlotAfternoon {
  time: string;
}

interface TimeSlotEvening {
  time: string;
}

interface TimeSlotNight {
  time: string;
}

interface TimeSlotArray {
  time: string;
}

interface Specialty {
  doctor: Doctors[];
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

@Injectable()
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

@Component({
  selector: 'app-appointment-list',
  templateUrl: './appointment-list.page.html',
  styleUrls: ['./appointment-list.page.scss'],
  providers: [
    { provide: DateAdapter, useClass: PickDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: PICK_FORMATS },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
  ],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    MatTabGroup,
    MatTab,
    FormsModule,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatRadioGroup,
    MatRadioButton,
    MatError,
    MatSelectTrigger,
    MatOptgroup,
    MatInput,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatSuffix,
    MatDatepicker,
    DatePipe,
    // FilterPipe,
    FilterUnique,
    BannerComponent,
  ],
})
export class AppointmentListPage implements OnInit, OnDestroy {
  appointments: any[] = [];
  conference: boolean;
  today = new Date();
  user: User;
  appointmentToday: any[] = [];
  isAppointmentToday: any;
  isAppointmentUpcoming: any;
  isAppointmentPast: boolean = false;
  appointmentUpcoming: any[] = [];
  appointmentPast: any[] = [];
  pastAppointment: boolean = false;
  noAppointments = false;
  noUpcomingAppointments = false;
  event = 'Show';
  pendingDate!: string | number;
  activeTab = 1; // Default to Upcoming appointments tab

  //APPT BOOKING

  @ViewChild('timeSelect', { static: false })
  timeSelect!: MatSelect;
  isBookAppointmetLoaded = false;
  hospitals: Hospital[] = [];
  specialityList = [];
  doctor!: DoctorArray | null;
  doctors: Doctors[] = [];
  minAppointmentDate;
  dateOfAppointment;
  hospital: Hospital | null = null;
  timeSlotAfternoon: TimeSlotAfternoon[] = [];
  timeSlotMorning: TimeSlotMorning[] = [];
  timeSlotEvening: TimeSlotEvening[] = [];
  timeSlotNight: TimeSlotNight[] = [];
  timeOfAppointment!: any;
  hospitalCode: string | undefined;
  doctorSlots = [];
  relations;
  familyMember: FamilyMember | null = null;
  familyMembers: FamilyMember[] = [];
  familyMemberId!: string;
  familyMemberPhone!: string;
  familyMemberName: any;
  selectedDoctorData = {
    doctorId: '',
    doctorName: '',
    canDoVideoConsultation: false,
  };
  isHidden = true;
  patientId: any;
  hospitalId: any;
  hospitalName: any;
  isPaymentRequired: any;
  isVideo;
  isBookingDisable = true;
  slots: undefined;
  timeSlotArray: TimeSlotArray[] = [];
  isHiddenFees = true;
  consultationType!: { name: any; price: number };
  consultationCode: any;
  videoConsultation;
  consultation;
  toFamilymember = false;
  specialityName: any;
  specialityCode: any;
  specialities: any;
  hideHospital: boolean = true;
  isSingleDoctor = false;
  isOptionGroup = false;
  noSlotsErrMessage = false;
  corporateHospital: any;
  corporateHospitals = [];
  showCorporateHospitals!: boolean;
  hideProgressBar = true;
  gateWayKey: any;
  doctorArray: DoctorArray[] = [];
  doctorGroups: DoctorGroup[] = [];
  draftAppointment: any;
  specialist!: Doctors | null;
  fees;
  hideHospitalOptions!: boolean;
  datePickerBox: any;
  mrn!: null;
  isNewPatient: boolean | undefined;
  checkRegisteredPatient!: boolean;
  hideAppointmentOptions!: boolean;
  timeSlotAvailable = true;
  showSpinnerForSlotLoading = false;
  hospitalAccount: any;
  timeOut: any;
  selectedHospitalDetails!: { contactDetails: { phone: any } };
  consentForm: any;
  selectedFamilyMemberDetails!: FamilyMember;
  selectedGlobalFamilyMember: GlobalFamilyMember | null = null;
  private subscriptions = new Subscription();
  isMobile = false;
  public devWidth = this.platform.width();
  entityCode!: string | null;

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private httpService: HttpService,
    private functionService: UtilityService,
    private storageService: StorageService,
    private dateService: DateService,
    private platform: Platform,
    public loadingController: LoadingController,
    private route: ActivatedRoute,
    private navService: NavigationService,
    private utilityService: UtilityService,
    private pageNavService: PageNavigationService,
    private globalFamilyMemberService: GlobalFamilyMemberService
  ) {
    if (this.devWidth < 770) {
      this.isMobile = true;
    }
    this.setPageTitle('Appointments');
    this.conference = false;
    this.user = this.storageService.get('user');
    this.minAppointmentDate = new Date();
    this.relations = this.utilityService.getRelations();
    this.relations.shift();

    try {
      this.draftAppointment =
        this.router.getCurrentNavigation()?.extras?.state?.[
          'draftAppointment'
        ] ?? null;
    } catch (error) {
      this.ngOnInit();
    }

    if (this.draftAppointment) {
      this.hideHospital = false;
      this.isHidden = false;
      this.isHiddenFees = false;
      this.dateOfAppointment = this.draftAppointment.appointmentDate;
      this.getTimeSlot();

      if (this.draftAppointment.consultationCharge.code === 'VID_CONS') {
        this.videoConsultation = this.draftAppointment.consultationCharge;
        this.fees = this.draftAppointment.consultationCharge.price;
        this.consultationType.name =
          this.draftAppointment.consultationCharge.chargeName;
      } else {
        this.consultation =
          this.draftAppointment.appointmentDetails.consultationCharge;
      }
      this.isVideo = this.draftAppointment.videoConsultation;

      let hospitalInfo = {
        code: this.draftAppointment.hospital.code,
        _id: this.draftAppointment.hospital.id,
        name: this.draftAppointment.hospital.name,
        paymentGatewayDetails: this.draftAppointment.paymentGatewayDetails,
      };
      this.getConsultationFee(
        this.draftAppointment.doctorId,
        this.draftAppointment.hospital.code
      );

      this.getDoctors(hospitalInfo);
    }
  }
  setPageTitle(title: string) {
    this.navService.pageChange(title);
  }

  async ngOnInit() {
    this.entityCode = this.route.snapshot.paramMap.get('hospitalCode');
    if (this.entityCode) {
    }
    this.user = this.storageService.get('user');

    // Load family members first to ensure global service has data
    await this.getFamilyMembers();

    // Set up subscription after family members are loaded
    this.setupGlobalFamilyMemberSubscription();

    // After family members are loaded, check for selected member again
    const selectedMember = this.globalFamilyMemberService.getSelectedMember();
    if (selectedMember) {
      this.selectedGlobalFamilyMember = selectedMember;
    }
  }

  ionViewWillEnter() {
    this.setPageTitle('Appointments');
    this.hideAppointmentOptions = false;
    this.hideHospitalOptions = false;

    // Check for selected family member when page becomes active
    const selectedMember = this.globalFamilyMemberService.getSelectedMember();

    if (selectedMember) {
      this.selectedGlobalFamilyMember = selectedMember;
    } else {
    }

    try {
      if (this.toFamilymember) {
        this.route.queryParams.subscribe((params) => {
          if (params['familyMemberID']) {
            this.hideHospital = false;
            this.getRecentlyAddedFamilyMember();
          }
        });
      }

      this.route.queryParams.subscribe((params) => {
        this.mrn = params['mrn'];
        if (params['navigateFrom'] === 'fromLinkPatient') {
          this.isHidden = false;
          this.checkRegisteredPatient = false;
          if (!this.mrn) {
            this.isNewPatient = true;
          }
        }

        // Check if we should open the upcoming tab
        if (params['tab'] === 'upcoming') {
          this.activeTab = 1;
        } else if (params['tab'] === 'past') {
          this.activeTab = 0;
        }
      });
    } catch (error) {
      // // // // console.log(error);
    }

    if (environment.HOSPITAL_ID) {
      this.getHospitalsById(environment.HOSPITAL_ID);
    } else {
      this.showCorporateHospitals = true;
      this.getHospitals();
    }

    // Set default tab to Upcoming
    if (this.activeTab !== 0) {
      this.activeTab = 1;
    }
    this.appointmentToday = [];
    this.appointmentUpcoming = [];
    this.appointmentPast = [];
    this.getSavedAppointments();

    // Set up back button handling with proper cleanup
    this.pageNavService.setupBackButton('/appointment-list', () => {
      this.router.navigate(['home']);
    });
  }

  goToBookAppointment() {
    this.router.navigate(['/home/appointment-booking']);
  }

  dateValidation(appointmentDate: string | number | Date) {
    this.pendingDate =
      this.dateService.getDateDifferenceInDays(appointmentDate);

    if (this.pendingDate === 0) {
      this.pendingDate = 'Today';
    } else if (this.pendingDate === 1) {
      this.pendingDate = 'Tomorrow';
    } else if (this.pendingDate > 1) {
      this.pendingDate = 'In ' + this.pendingDate + ' days';
    } else {
      this.pendingDate = 'Past';
    }
    return this.pendingDate;
  }

  async getSavedAppointments() {
    this.user = this.storageService.get('user');
    const getAppointmentURL = '/appointment?userId=' + this.user.id;
    await this.httpService
      .getInBackground(getAppointmentURL, true)
      .then((appointment: any) => {
        if (appointment.length > 0) {
          // this.markAppointmentsAsRead();

          this.appointments = appointment;
          this.noAppointments = false;
          this.noUpcomingAppointments = false;

          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < this.appointments.length; i++) {
            if (this.appointments[i].appointmentTime !== null) {
              this.appointments[i].appointmentTime =
                this.dateService.to12HourFormat(
                  this.appointments[i].appointmentTime
                );
            }

            if (!this.appointments[i].active) {
              continue;
            }

            this.appointments[i].appointmentDate = this.appointments[
              i
            ].appointmentDate.slice(0, 10);
            const todayDate = this.functionService
              .toISODateTime(new Date())
              .slice(0, 10);

            if (todayDate < this.appointments[i].appointmentDate) {
              if (this.appointments[i].status === 'CLOSED') {
                this.appointments[i].appointmentDate = new Date(
                  this.appointments[i].appointmentDate
                );
                this.appointmentPast.push(this.appointments[i]);
              } else {
                this.appointmentUpcoming.push(this.appointments[i]);
                this.appointments[i].appointmentDate = new Date(
                  this.appointments[i].appointmentDate
                );
              }
            } else if (todayDate > this.appointments[i].appointmentDate) {
              this.appointments[i].appointmentDate = new Date(
                this.appointments[i].appointmentDate
              );
              this.appointmentPast.push(this.appointments[i]);
            } else {
              if (this.appointments[i].status === 'CLOSED') {
                this.appointments[i].appointmentDate = new Date(
                  this.appointments[i].appointmentDate
                );
                this.appointmentPast.push(this.appointments[i]);
              } else {
                this.appointments[i].appointmentDate = new Date(
                  this.appointments[i].appointmentDate
                );
                this.appointmentToday.push(this.appointments[i]);
              }
            }
            this.appointmentPast = this.appointmentPast
              .slice()
              .sort((a, b) => b.appointmentDate - a.appointmentDate);
          }
        } else {
          this.noAppointments = true;
          this.noUpcomingAppointments = true;
        }
        if (
          !(this.appointmentUpcoming.length > 0) &&
          !(this.appointmentToday.length > 0)
        ) {
          this.noUpcomingAppointments = true;
        }
        if (!(this.appointmentPast.length > 0)) {
          this.noAppointments = true;
        }
      })
      .catch((error) => {
        // // // console.error('Error', error);
      });
  }

  markAppointmentsAsRead() {
    const url = '/appointment/markasread/?userId=' + this.user.id;

    this.httpService
      .get(url)
      .then((appointments: any) => {
      })
      .catch((error) => {
        // // // // // console.log('Failed to mark appointments as read', error);
      });
  }

  showPastAppointment() {
    this.isAppointmentPast = true;
    this.noUpcomingAppointments = false;

    if (this.isAppointmentPast) {
      this.pastAppointment = false;
    }
  }

  getStatus(status: string) {
    // 0: Draft; 1: Payment Pending; 2. Awaiting confirmation from hospital
    // 3: Scheduled; 4: Payment Failed;  8: Cancelled

    let statusString;

    switch (status) {
      case 'DRAFT':
        statusString = 'DRAFT';
        break;

      case 'PAYMENT_PENDING':
        statusString = 'PAYMENT PENDING';
        break;

      case 'AWAITING_CONFIRMATION_FROM_HOSPITAL':
        statusString = 'AWAITING';
        break;

      case 'SCHEDULED':
        statusString = 'SCHEDULED';
        break;

      case 'PAYMENT_FAILED':
        statusString = 'PAYMENT FAILED';
        break;

      case 'CANCELLED':
        statusString = 'CANCELLED';
        break;

      case 'CLOSED':
        statusString = 'CLOSED';
        break;

      case 'RE_SCHEDULED':
        statusString = 'RESCHEDULED';
        break;

      case 'STARTED':
        statusString = 'STARTED';
        break;
    }

    return statusString;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'CLOSED':
        return 'status-closed';
      case 'SCHEDULED':
        return 'status-scheduled';
      case 'STARTED':
        return 'status-started';
      case 'DRAFT':
        return 'status-draft';
      case 'PAYMENT_PENDING':
        return 'status-payment-pending';
      case 'AWAITING_CONFIRMATION_FROM_HOSPITAL':
        return 'status-awaiting';
      case 'PAYMENT_FAILED':
        return 'status-payment-failed';
      case 'CANCELLED':
        return 'status-cancelled';
      case 'RE_SCHEDULED':
        return 'status-rescheduled';
      default:
        return 'status-default';
    }
  }

  formatDoctorName(doctorName: string): string {
    if (!doctorName) return '';

    // Remove any existing "Dr." or "Dr" prefix (case insensitive) and trim whitespace
    const cleanName = doctorName.replace(/^(dr\.?\s*)/i, '').trim();

    // Add "Dr." prefix only if the name doesn't start with it
    return `Dr. ${cleanName}`;
  }

  async tabClick(tab: { index: number }) {
    this.activeTab = tab.index;
    // No booking form in tabs anymore - booking moved to separate page
  }

  openConference(appointment: { videoConsultation: any; paymentStatus: any }) {
    const navigationExtras: NavigationExtras = {
      state: {
        appointmentDetails: appointment,
      },
    };
    this.router.navigate(['/home/appointment-details'], navigationExtras);
  }

  // BOOKING APPOINTMENT
  viewReceipt(appointment: any) {
    const navigationExtras: NavigationExtras = {
      state: {
        appointment: appointment,
        navigationFrom: 'Appointment-details',
      },
    };
    this.router.navigate(['/home/appointment-confirmed'], navigationExtras);
  }

  async loadBookingAppointmentDetails() {
  }

  pickerOpen(picker: MatDatepicker<Date>) {
    this.datePickerBox = picker;
    this.datePickerBox.open();
  }

  openFamilyMemberPopUp() {
    this.hospital = null;
    this.doctor = null;
    this.specialist = null;
    this.dateOfAppointment = null;
    this.slots = undefined;
    this.timeOfAppointment = null;
    this.isVideo = false;
    this.isHiddenFees = true;
    this.isHidden = true;
    this.isNewPatient = false;
    this.checkRegisteredPatient = false;
    this.hideHospital = true;
    this.timeSlotArray.length = 0;
    this.timeSlotEvening.length = 0;
    this.timeSlotMorning.length = 0;
    this.timeSlotAfternoon.length = 0;
    this.showSpinnerForSlotLoading = false;

    this.hideAppointmentOptions = true;
    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: { familyMemberID: null },
    });

    this.toFamilymember = true;
    setTimeout(() => {
      const navigationExtras: NavigationExtras = {
        state: {
          isAppointment: true,
        },
      };
      this.router.navigate(['/home/family-member-form'], navigationExtras);
    }, 700);
  }

  getFamilyMemberId(familyMember: FamilyMember) {
    this.hospital = null;
    this.doctor = null;
    this.specialist = null;
    this.dateOfAppointment = null;
    this.slots = undefined;
    this.timeOfAppointment = null;
    this.isVideo = false;
    this.isHiddenFees = true;
    this.checkRegisteredPatient = false;
    this.mrn = null;
    this.isHidden = true;
    this.isNewPatient = false;
    this.timeSlotArray.length = 0;
    this.timeSlotEvening.length = 0;
    this.timeSlotMorning.length = 0;
    this.timeSlotAfternoon.length = 0;
    this.showSpinnerForSlotLoading = false;

    this.hideHospital = false;
    this.familyMemberId = familyMember._id;
    this.familyMemberPhone = familyMember.phone;
    this.familyMemberName = familyMember.fullName;
    this.selectedFamilyMemberDetails = familyMember;

    if (!this.familyMemberPhone) {
      this.familyMemberPhone = this.user.phone;
    }
  }

  async getFamilyMembers() {
    let getURL;
    if (this.draftAppointment) {
      getURL = '/familyMember/' + this.draftAppointment.familyMemberId;
    } else {
      getURL = '/familyMember/?userId=' + this.user.id;
    }

    await this.httpService
      .get(getURL, true) // Skip family member filtering for family member API calls
      .then((familyMembers) => {
        if (familyMembers !== '') {
          if (this.draftAppointment) {
            this.familyMembers.push(familyMembers);
            this.familyMember = this.familyMembers[0];
          } else {
            this.familyMembers = familyMembers;

            // Load family members into global service to ensure it has data
            this.globalFamilyMemberService.loadFamilyMembers(familyMembers);

            // Check if there's now a selected member after loading
            const selectedMember = this.globalFamilyMemberService.getSelectedMember();
            if (selectedMember) {
              this.selectedGlobalFamilyMember = selectedMember;
            }

            if (this.familyMembers.length === 1) {
              this.familyMember = this.familyMembers[0];
              this.hideHospital = false;
              this.getFamilyMemberId(this.familyMembers[0]);
            }
          }
        }
      })
      .catch((error) => {
        // // // // console.log('Fetching Error', error);
      });
  }

  async getRecentlyAddedFamilyMember() {
    const getPatientsURL = '/familyMember/?userId=' + this.user.id;
    await this.httpService
      .get(getPatientsURL)
      .then((familyMembers) => {
        if (familyMembers) {
          this.familyMembers = familyMembers.reverse();

          this.familyMember = this.familyMembers[0];
          this.familyMemberId = familyMembers[0]._id;
          this.familyMemberPhone = familyMembers[0].phone;
          this.familyMemberName = familyMembers[0].fullName;
          this.selectedFamilyMemberDetails = familyMembers[0];
        }
      })
      .catch((error) => {
        // // // // console.log('Fetching Error', error);
      });
  }

  hospitalPreference() {
    this.hideHospitalOptions = true;
    setTimeout(() => {
      this.router.navigate(['/home/hospital-preference']);
    }, 700);
  }

  async getHospitalByPreference() {
    const getMemberURL = '/user/' + this.user.id;
    await this.httpService
      .get(getMemberURL)
      .then((user) => {
        if (user) {
          if (user.data.preference.hospitalPreferences.length > 0) {
            let preferredHospitals: Hospital[] = [];

            // tslint:disable-next-line:prefer-for-of
            for (let j = 0; j < this.hospitals.length; j++) {
              // tslint:disable-next-line:prefer-for-of
              for (
                let i = 0;
                i < user.data.preference.hospitalPreferences.length;
                i++
              ) {
                if (
                  this.hospitals[j]._id ===
                  user.data.preference.hospitalPreferences[i].hospitalId
                ) {
                  preferredHospitals.push(this.hospitals[j]);
                  break;
                }
              }
            }

            this.hospitals.length = 0;
            this.hospitals = preferredHospitals;

            if (this.draftAppointment) {
              // tslint:disable-next-line:prefer-for-of
              for (let i = 0; i < this.hospitals.length; i++) {
                if (
                  this.hospitals[i].name === this.draftAppointment.hospital.name
                ) {
                  this.hospital = this.hospitals[i];
                }
              }
            }
          } else {
            this.getHospitals();
          }
        }
      })
      .catch((error) => {
        // // // console.error('Fetching Error', error);
        this.getHospitals();
      });
  }

  async getHospitals() {

    let getHospitalURL = '/hospital/?active=true';

    if (this.platform.is('capacitor')) {
      getHospitalURL += '&parentId=33';
    } else if (this.storageService.get('parentId')) {
      getHospitalURL += '&parentId=' + this.storageService.get('parentId');
    }

    await this.httpService
      .get(getHospitalURL)
      .then((hospital) => {
        if (hospital.length > 0) {
          this.hospitals = hospital;

          return hospital;
        } else {
          const getHospitalURL = '/hospital/?active=true';
          this.httpService.get(getHospitalURL).then((hospital) => {
            if (hospital.length > 0) {
              this.hospitals = hospital;

              return hospital;
            }
          });
        }
      })
      .catch((error) => {
        // // // // console.log('Error', error);
      });
  }

  async getHospitalsById(parentId: never) {
    const getHospitalURL = '/hospital/?active=true';

    await this.httpService
      .get(getHospitalURL)
      .then((hospital) => {
        if (hospital.length > 0) {
          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < hospital.length; i++) {
            if (hospital[i].parentId === parentId) {
              if (hospital[i].parentId !== hospital[i].entityId) {
                this.hospitals.push(hospital[i]);
              }
            }
          }
          return hospital;
        }
      })
      .catch((error) => {
        // // // // console.log('Error', error);
      });
  }

  async getSpecialists(hospital: {
    code: string | undefined;
    _id: any;
    name: any;
    paymentGatewayDetails: { key: any };
  }) {
    this.doctor = null;
    this.dateOfAppointment = null;
    this.slots = undefined;
    this.timeOfAppointment = null;
    this.isHiddenFees = true;

    this.hospitalCode = hospital.code;
    this.hospitalId = hospital._id;
    this.hospitalName = hospital.name;
    this.gateWayKey = hospital.paymentGatewayDetails.key;
    this.getFamilyMemberHospitalAccount();
    const getPatientsURL = '/speciality/?hospitalCode=' + this.hospitalCode;

    await this.httpService
      .get(getPatientsURL)
      .then((specialty) => {
        if (specialty !== '') {
          this.specialityList = specialty.data.specialities;
        }
      })
      .catch((error) => {
        // // // // console.log('Fetching Error', error);
        this.utilityService.presentAlert(
          'Fetching Error',
          'No specialty found.'
        );
      });
  }

  async getDoctors(hospital: any) {
    if (!this.isVideo) {
      return;
    }
    if (!this.draftAppointment) {
      this.doctor = null;
      this.specialist = null;
      this.dateOfAppointment = null;
      this.slots = undefined;
      this.timeOfAppointment = null;
      this.isHiddenFees = true;
      this.doctors.length = 0;
      this.doctorArray.length = 0;
      this.isHidden = true;
      this.timeSlotArray.length = 0;
      this.timeSlotEvening.length = 0;
      this.timeSlotMorning.length = 0;
      this.timeSlotAfternoon.length = 0;
      this.checkRegisteredPatient = false;
      this.mrn = null;
      this.isNewPatient = false;
      this.showSpinnerForSlotLoading = false;
    }

    this.hospitalCode = hospital.code;
    this.hospitalId = hospital._id;
    this.hospitalName = hospital.name;
    this.isPaymentRequired = hospital.paymentRequired;
    this.selectedHospitalDetails = hospital;
    if (this.draftAppointment) {
      this.gateWayKey = this.draftAppointment.paymentDetails.gatewayKey;
    } else {
      this.gateWayKey = hospital.paymentGatewayDetails.key;
    }

    this.getFamilyMemberHospitalAccount();

    const getDoctorURL = '/doctor/?hospitalCode=' + this.hospitalCode;

    await this.httpService
      .getInBackground(getDoctorURL, true)
      .then((doctors: any) => {
        // Determine the correct path to doctors array
        let doctorsArray;
        if (doctors.data && doctors.data.doctors) {
          doctorsArray = doctors.data.doctors;
        } else if (doctors.doctors) {
          doctorsArray = doctors.doctors;
        } else {
          console.error('Could not find doctors array in response');
          return;
        }

        if (this.isVideo === 'videoConsultation') {
          doctorsArray = doctorsArray.filter(function (doctor: {
            canDoVideoConsultation: string;
          }) {
            return doctor.canDoVideoConsultation !== '0';
          });
        } else if (this.isVideo === 'atTheHospital') {
          doctorsArray = doctorsArray.filter(function (
            doctor: any
          ) {
            doctor['canDoVideoConsultation'] = '0';
            return doctor;
          });
        }

        if (doctorsArray && doctorsArray.length > 0) {
          this.doctors = doctorsArray.slice(0);
          this.doctorArray = doctorsArray.slice(0);

          /* For testing purpose
          // this.doctors = [doctors.data.doctors[0]]
          // this.doctorArray = [doctors.data.doctors[0]] */
          if (this.doctors.length >= 10) {
            this.isOptionGroup = false;
            this.isSingleDoctor = false;
          }
          // Grouping the doctors based on their specialities

          if (this.doctors.length > 1 && this.doctors.length < 10) {
            this.isOptionGroup = true;
            this.isSingleDoctor = false;
            let doctors = this.doctors;

            let result = [
              ...new Set(
                doctors.map((speciality: any) => speciality.specialityName)
              ),
            ].map((speciality) => ({ name: speciality, doctors }));
            doctors.forEach((x) => {
              const found = result.find((y) => y.name === x.specialityName);

              if (found) {
                found.doctors.push(x);
              } else {
              console.error(
                  `Speciality '${x.specialityName}' not found in result.`
                );
              }
              // result.find((y) => y.name === x.specialityName).doctors.push(x)
            });

            this.doctorGroups = result;
          }

          if (this.doctors.length === 1) {
            this.isOptionGroup = false;
            this.isSingleDoctor = true;
            this.doctor = this.doctorArray[0];
            this.getCurrentDoctor(this.doctor);
          }

          if (this.draftAppointment) {
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < this.doctors.length; i++) {
              if (
                this.doctors[i].specialityName ===
                this.draftAppointment.specialityName
              ) {
                this.specialist = this.doctors[i];
                break;
              }
            }

            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < this.doctorArray.length; i++) {
              if (
                this.doctorArray[i].doctorName ===
                this.draftAppointment.doctorName
              ) {
                this.doctor = this.doctorArray[i];
                break;
              }
            }
          }
        }
      })
      .catch((error) => {
        console.error('Error fetching doctors:', error);
      });
  }

  getDoctorsArray(specialityCode: any, specialityName: any) {

    this.doctor = null;
    this.dateOfAppointment = null;
    this.slots = undefined;
    this.timeOfAppointment = null;
    this.isHiddenFees = true;
    this.timeSlotArray.length = 0;
    this.selectedDoctorData.doctorId = '';
    this.timeSlotEvening.length = 0;
    this.timeSlotMorning.length = 0;
    this.timeSlotAfternoon.length = 0;
    this.showSpinnerForSlotLoading = false;

    this.doctorArray.length = 0;
    this.specialityCode = specialityCode;
    this.specialityName = specialityName;
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < this.doctors.length; i++) {
      if (specialityCode === this.doctors[i].specialityCode) {
        this.doctorArray.push(this.doctors[i]);
      }
    }
  }

  async getConsultationFee(doctorId: string, hospitalCode: string | undefined) {
    const getDoctorURL =
      '/doctor/?id=' + doctorId + '&hospitalCode=' + hospitalCode;

    await this.httpService
      .get(getDoctorURL)
      .then((doctor) => {
        // Handle both response formats: direct data or wrapped in 'data' property
        if (doctor) {
          // Check if response has data wrapper
          const responseData = doctor.data || doctor;

          this.consultation = responseData.consultationCharge;
          this.videoConsultation = responseData.videoConsultationCharge;
        }
      })
      .catch((error) => {
        console.error('Error fetching consultation fee:', error);
      });
  }

  async getCurrentDoctor(doctor: any) {

    this.selectedDoctorData.doctorId = doctor.doctorId;
    this.selectedDoctorData.doctorName = doctor.doctorName;
    this.selectedDoctorData.canDoVideoConsultation =
      doctor.canDoVideoConsultation === '0' ? false : true;
    this.specialityCode = doctor.specialityCode;
    this.specialityName = doctor.specialityName;

    await this.getConsultationFee(
      this.selectedDoctorData.doctorId,
      this.hospitalCode
    );

    this.dateOfAppointment = null;
    this.timeOfAppointment = null;
    this.fees = null;
    this.slots = undefined;
    this.timeSlotArray.length = 0;
    this.timeSlotEvening.length = 0;
    this.timeSlotMorning.length = 0;
    this.timeSlotAfternoon.length = 0;
    this.showSpinnerForSlotLoading = false;
    this.timeSlotAvailable = false;
  }

  setTimeforSpinner() {
    this.timeOut = setTimeout(() => {
      // tslint:disable-next-line: max-line-length
      if (
        this.timeSlotEvening.length === 0 &&
        this.timeSlotMorning.length === 0 &&
        this.timeSlotAfternoon.length === 0
      ) {
        this.showSpinnerForSlotLoading = true;
      }
    }, 1000);
    return this.timeOut;
  }

  async getTimeSlot() {
    this.timeSlotAvailable = false;

    this.setTimeforSpinner();

    if (!this.draftAppointment) {
      this.slots = undefined;
      this.timeOfAppointment = null;

      this.isHiddenFees = true;
    }

    this.timeSlotEvening.length = 0;
    this.timeSlotMorning.length = 0;
    this.timeSlotAfternoon.length = 0;
    this.timeSlotNight.length = 0;

    this.selectedDoctorData.doctorId = this.selectedDoctorData.doctorId
      ? this.selectedDoctorData.doctorId
      : this.draftAppointment.doctorId;
    this.hospitalCode = this.hospitalCode
      ? this.hospitalCode
      : this.draftAppointment.hospital.code;
    this.dateOfAppointment = this.dateOfAppointment
      ? new Date(this.dateOfAppointment)
      : new Date(this.draftAppointment.appointmentDate);

    let videoConsultationHoursOnly;

    if (this.isVideo === 'videoConsultation') {
      videoConsultationHoursOnly = true;
    } else {
      videoConsultationHoursOnly = false;
    }

    // tslint:disable-next-line:max-line-length
    const getTimeSlotURL =
      '/appointment/slot/?hospitalCode=' +
      this.hospitalCode +
      '&doctorId=' +
      this.selectedDoctorData.doctorId +
      '&appointmentDate=' +
      this.utilityService.toISODateTime(this.dateOfAppointment) +
      '&videoConsultationHoursOnly=' +
      videoConsultationHoursOnly;

    await this.httpService
      .get(getTimeSlotURL)
      .then((timeSlot) => {
        // this.loadingDismiss();
        this.showSpinnerForSlotLoading = false;

        if (timeSlot) {
          if (
            timeSlot.data.Evening ||
            timeSlot.data.Night ||
            timeSlot.data.Afternoon ||
            timeSlot.data.Morning
          ) {
            this.timeSlotAvailable = true;
            this.isHidden = false;
            document.getElementById('noSlotsAvailable')!.textContent = null;
            document.getElementById('noSlotsAvailable')!.style.marginTop = '0';

            if (timeSlot.data.Evening) {
              // tslint:disable-next-line: prefer-for-of
              for (let i = 0; i < timeSlot.data.Evening.length; i++) {
                if (timeSlot.data.Evening[i].available === true) {
                  this.timeSlotEvening.push(timeSlot.data.Evening[i]);
                }
              }
            }
            if (timeSlot.data.Night) {
              // tslint:disable-next-line: prefer-for-of
              for (let i = 0; i < timeSlot.data.Night.length; i++) {
                if (timeSlot.data.Night[i].available === true) {
                  this.timeSlotEvening.push(timeSlot.data.Night[i]);
                }
              }
            }
            if (timeSlot.data.Afternoon) {
              // tslint:disable-next-line: prefer-for-of
              for (let i = 0; i < timeSlot.data.Afternoon.length; i++) {
                if (timeSlot.data.Afternoon[i].available === true) {
                  this.timeSlotAfternoon.push(timeSlot.data.Afternoon[i]);
                }
              }
            }
            if (timeSlot.data.Morning) {
              // tslint:disable-next-line: prefer-for-of
              for (let i = 0; i < timeSlot.data.Morning.length; i++) {
                if (timeSlot.data.Morning[i].available === true) {
                  this.timeSlotMorning.push(timeSlot.data.Morning[i]);
                }
              }
            }
          } else {
            this.showSpinnerForSlotLoading = false;

            document.getElementById('noSlotsAvailable')!.textContent =
              'No slots available';
            document.getElementById('noSlotsAvailable')!.style.marginBottom =
              '6%';
            this.timeSlotAvailable = false;
            clearTimeout(this.timeOut);
          }
        }
      })
      .catch((error) => {
        this.showSpinnerForSlotLoading = false;
        this.timeSlotAvailable = false;
        // // // console.error('Fetching Error', error);
        clearTimeout(this.timeOut);
        this.utilityService.presentAlert('Error!', 'Time slots not available.');
      });
  }

  async getFamilyMemberHospitalAccount() {
    const getFamilyMemberHospitalAccountURL =
      '/familyMemberHospitalAccount/?familyMemberId=' +
      this.familyMemberId +
      '&hospitalCode=' +
      this.hospitalCode;

    await this.httpService
      .get(getFamilyMemberHospitalAccountURL)
      .then((hospitalAccount) => {
        if (hospitalAccount.length > 0) {
          this.isHidden = true;
        } else {
          this.getHospitalAccountInformation();
        }
      })
      .catch((error) => {
        // // // console.error('Error', error);
      });
  }

  openLinkPatient() {
    const navigationExtras: NavigationExtras = {
      state: {
        hospitalAccountInfo: this.hospitalAccount,
        familyMemberId: this.familyMemberId,
        familyMemberName: this.familyMemberName,
        hospitalCode: this.hospitalCode,
        hospitalId: this.hospitalId,
        hospitalName: this.hospitalName,
        phone: this.familyMemberPhone,
        userId: this.user.id,
        selectedPatientMrn: this.mrn,
      },
    };

    this.router.navigate(['/home/select-patient'], navigationExtras);
  }

  async getHospitalAccountInformation() {
    const getHospitalAccountInformationURL =
      '/familyMemberHospitalAccount/patient/?phoneNo=' +
      this.familyMemberPhone +
      '&hospitalCode=' +
      this.hospitalCode;

    await this.httpService
      .get(getHospitalAccountInformationURL)
      .then((hospitalAccount) => {
        this.checkRegisteredPatient = true;


        if (
          hospitalAccount.data.patients &&
          hospitalAccount.data.patients.length > 0
        ) {
          this.hospitalAccount = hospitalAccount.data.patients;
          this.checkRegisteredPatient = true;
        } else {
          this.isNewPatient = false;
          this.isHidden = true;
          this.checkRegisteredPatient = false;
        }
      })
      .catch((error) => {
        // // // console.error('Error', error);
      });
  }

  async getConsultationType(event: string) {
    if (!this.familyMember) {
      return;
    }
    this.isHiddenFees = false;

    if (this.doctor) {
      await this.getCurrentDoctor(this.doctor);
    }
    this.dateOfAppointment = null;
    this.slots = undefined;
    this.timeOfAppointment = null;
    this.isHiddenFees = true;
    this.timeSlotArray.length = 0;
    this.timeSlotEvening.length = 0;
    this.timeSlotMorning.length = 0;
    this.timeSlotAfternoon.length = 0;
    this.isBookingDisable = true;
    if (this.hospital) {
      await this.getDoctors(this.hospital);
    }
    document.getElementById('noSlotsAvailable')!.textContent = null;
    document.getElementById('noSlotsAvailable')!.style.marginTop = '0';

    if (this.timeOfAppointment) {
      this.isBookingDisable = false;
    }

    if (event === 'videoConsultation') {
      this.consultationType = this.videoConsultation;
    } else if (event === 'atTheHospital') {
      if (this.draftAppointment) {
        this.getConsultationFee(
          this.draftAppointment.doctorId,
          this.draftAppointment.hospital.code
        );
      }

      this.consultationType = this.consultation;
    }
  }

  onRadioSelected(event: string) {
    this.timeOfAppointment = null;

    if (event === 'Morning') {
      this.timeSlotArray = [];
      this.timeSlotArray = this.timeSlotMorning;
    } else if (event === 'Afternoon') {
      this.timeSlotArray = [];
      this.timeSlotArray = this.timeSlotAfternoon;
    } else {
      this.timeSlotArray = [];
      this.timeSlotArray = this.timeSlotEvening;
    }

    setTimeout(() => {
      this.timeSelect.open();
    }, 1);
  }

  scrollToBottom() {
    this.isVideo
      ? (this.isBookingDisable = false)
      : (this.isBookingDisable = true);

    const element = document.getElementById('dummyDiv');
    element?.scrollIntoView({ behavior: 'smooth', block: 'end' });

    if (this.isVideo === 'videoConsultation') {
      this.consultationType = this.videoConsultation;
    } else if (this.isVideo === 'atTheHospital') {
      if (this.draftAppointment) {
        this.getConsultationFee(
          this.draftAppointment.doctorId,
          this.draftAppointment.hospital.code
        );
      }

      this.consultationType = this.consultation;
    }
    this.isHiddenFees = false;
  }

  getConsentForm() {
    if (!this.timeOfAppointment.time) {
      this.utilityService.presentAlert(
        'Select time slot',
        'Please select a time slot.'
      );
      return;
    }

    if (!this.isVideo) {
      this.utilityService.presentAlert(
        'Select consultation type',
        'Please select a consultation type.'
      );
      return;
    }

    if (!this.isPaymentRequired) {
      this.consultationType.price = 0;
    }

    const appointmentInfo = {
      familyMemberId: this.familyMemberId,
      hospitalCode: this.hospitalCode,
      doctorId: this.selectedDoctorData.doctorId,
      doctorName: this.selectedDoctorData.doctorName,
      specialityCode: this.specialityCode,
      specialityName: this.specialityName,
      appointmentDate: this.utilityService.toISODateTime(
        this.dateOfAppointment
      ),
      appointmentTime: this.timeOfAppointment.time,
      videoConsultation: this.isVideo === 'videoConsultation' ? true : false,
      paymentDetails: { gatewayKey: this.gateWayKey },
      consultationCharge: this.consultationType,
      hospitalName: this.hospitalName,
      patientName: this.familyMemberName,
    };

    if (this.isVideo === 'videoConsultation') {
      const details = {
        patientName: this.familyMemberName,
        patientDOB: this.selectedFamilyMemberDetails.dob,
        familyMemberId: this.familyMemberId,
        hospitalCode: this.hospitalCode,
        hospitalName: this.hospitalName,
        speciality: this.specialityName,
        doctorName: this.selectedDoctorData.doctorName,
        hospitalContactNumber:
          this.selectedHospitalDetails.contactDetails.phone,
        appointment: appointmentInfo,
      };

      const navigationExtras: NavigationExtras = {
        state: {
          details: details,
        },
      };
      this.router.navigate(['/home/consent-form'], navigationExtras);
    } else {
      const navigationExtras: NavigationExtras = {
        state: {
          appointment: appointmentInfo,
        },
      };
      this.router.navigate(['/home/confirm-appointment'], navigationExtras);
    }
  }

  private setupGlobalFamilyMemberSubscription() {
    // Track if this is the first emission (on setup)
    let isFirstEmission = true;

    this.subscriptions.add(
      this.globalFamilyMemberService.selectedFamilyMember$.subscribe(
        (member: GlobalFamilyMember | null) => {
          this.selectedGlobalFamilyMember = member;
          if (member) {
            // Auto-select the global family member
            this.autoSelectGlobalFamilyMember(member);

            // Only reload appointments if this is not the first emission
            // First emission happens on setup, appointments will be loaded by ionViewWillEnter
            if (!isFirstEmission) {
              // Reload all appointments (Past, Upcoming, Today) for the selected family member
              this.appointmentToday = [];
              this.appointmentUpcoming = [];
              this.appointmentPast = [];
              this.getSavedAppointments();

              // Reset form when family member changes
              this.resetAppointmentForm();
            }

            isFirstEmission = false;
          }
        }
      )
    );

    // Check if there's already a selected global family member on init
    const selectedMember = this.globalFamilyMemberService.getSelectedMember();
    if (selectedMember) {
      this.selectedGlobalFamilyMember = selectedMember;
      this.autoSelectGlobalFamilyMember(selectedMember);
    }
  }

  private autoSelectGlobalFamilyMember(globalMember: GlobalFamilyMember) {
    // Guard clause: ensure family members are loaded before proceeding
    if (!this.familyMembers || this.familyMembers.length === 0) {
      return;
    }

    // Find matching family member in the local list
    const memberId = this.globalFamilyMemberService.getMemberId(globalMember);
    const matchingMember = this.familyMembers.find(fm =>
      fm._id === memberId ||
      (fm as any).id === memberId
    );

    if (matchingMember) {
      // Auto-select the matching family member
      this.familyMember = matchingMember;
      this.getFamilyMemberId(matchingMember);

      // Ensure the form recognizes that a family member is selected
      // This fixes the disabled state issue for subsequent form fields
      this.familyMemberId = matchingMember._id;
      this.familyMemberPhone = matchingMember.phone || this.user.phone;
      this.familyMemberName = matchingMember.fullName;
      this.selectedFamilyMemberDetails = matchingMember;
    } else {
      // // // console.warn('Global family member not found in appointment list family members');
    }
  }

  private resetAppointmentForm() {
    // Reset form fields when family member changes
    this.hospital = null;
    this.doctor = null;
    this.specialist = null;
    this.dateOfAppointment = null;
    this.slots = undefined;
    this.timeOfAppointment = null;
    this.isVideo = null;
    this.isHiddenFees = true;
    this.isHidden = true;
    this.timeSlotArray.length = 0;
    this.timeSlotEvening.length = 0;
    this.timeSlotMorning.length = 0;
    this.timeSlotAfternoon.length = 0;
    this.showSpinnerForSlotLoading = false;
  }

  getInitials(fullName: string): string {
    if (!fullName) return '?';

    const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }

    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.unsubscribe();
    // Clean up back button handler
    this.pageNavService.cleanupBackButton('/appointment-list');
  }
}
