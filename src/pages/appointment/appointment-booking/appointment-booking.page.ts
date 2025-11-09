import { AppointmentPaymentService } from './../../../services/payment-gateway/appointment-payment.service';
import { StorageService } from './../../../services/storage/storage.service';
import { UtilityService } from './../../../services/utility/utility.service';
import { HttpService } from './../../../services/http/http.service';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { BackButtonService } from 'src/services/navigation/backButton/back-button.service';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { GlobalFamilyMemberService, FamilyMember } from '../../../services/family-member/global-family-member.service';
import {
  NavController,
  Platform,
  LoadingController,
  AlertController,
  IonicModule,
} from '@ionic/angular';
import {
  NativeDateAdapter,
  DateAdapter,
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
import { formatDate, CommonModule, NgFor, NgIf } from '@angular/common';
import { environment } from 'src/environments/environment';
import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { PageNavigationService } from 'src/services/navigation/page-navigation.service';
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
import { trigger, state, style, transition, animate } from '@angular/animations';

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

declare var RazorpayCheckout: any;

interface FamilyMembers {
  fullName: string;
}

interface Hospitals {
  _id: number;
  name: string;
  cityName: string;
}

interface DoctorsGroups {
  doctors: any;
  name: any;
}

interface Doctors {
  doctorId?: any;
  specialityCode: any;
  specialityName: any;
  doctorName: any;
  canDoVideoConsultation: any;
  doctorRegistrationNo?: any;
}

interface DoctorArray {
  doctorId?: any;
  doctorName: any;
  canDoVideoConsultation: any;
  doctorRegistrationNo?: any;
}

interface TimeSlotEvening {
  time: any;
}

interface TimeSlotArray {
  time: any;
}

interface TimeSlotAfternoon {
  time: any;
}

interface TimeSlotMorning {
  time: any;
}

interface ConsultationType {
  price: number;
  name: string;
}

@Component({
  selector: 'app-appointment-booking',
  templateUrl: './appointment-booking.page.html',
  styleUrls: ['./appointment-booking.page.scss'],
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
    FormsModule,
    CommonModule,
    MatFormField,
    MatLabel,
    MatSelect,
    NgFor,
    MatOption,
    NgIf,
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
    FilterPipe,
    FilterUnique,
  ],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class AppointmentBookingPage implements OnInit, OnDestroy {
  @ViewChild('timeSelect', { static: false })
  timeSelect!: MatSelect;

  // Step management
  currentStep = 1;
  highestStepReached = 1; // Track the furthest step user has completed

  hospitals: Hospitals[] = [];
  specialityList = [];
  doctor!: DoctorArray | null;
  doctors: Doctors[] = [];
  minAppointmentDate;
  dateOfAppointment;
  hospital!: Hospitals | null;
  timeSlotAfternoon: TimeSlotAfternoon[] = [];
  timeSlotMorning: TimeSlotMorning[] = [];
  timeSlotEvening: TimeSlotEvening[] = [];
  timeSlotNight = [];
  timeOfAppointment: any;
  hospitalCode: string | undefined;
  doctorSlots = [];
  relations;
  user;
  familyMember: any;
  familyMembers: FamilyMembers[] = [];
  familyMemberId!: string;
  familyMemberPhone!: string;
  familyMemberName: any;
  globalFamilyMembers: FamilyMember[] = [];
  selectedGlobalFamilyMember: FamilyMember | null = null;
  isFamilyMemberReadOnly = false;
  selectedDoctorData = {
    doctorId: '',
    doctorName: '',
    canDoVideoConsultation: false,
  };
  isHidden = true;
  patientId: any;
  hospitalId: any;
  hospitalName: any;
  isVideo;
  isBookingDisable = true;
  slots: undefined;
  timeSlotArray: TimeSlotArray[] = [];
  isHiddenFees = true;
  consultationType!: ConsultationType;
  consultationCode: any;
  videoConsultation;
  consultation;
  toFamilymember = false;
  specialityName: any;
  specialityCode: any;
  specialities: any;
  hideHospital = true;
  isSingleDoctor = false;
  isOptionGroup = false;
  noSlotsErrMessage = false;
  corporateHospital: any;
  corporateHospitals = [];
  showCorporateHospitals!: boolean;
  hideProgressBar = true;
  gateWayKey: any;
  doctorArray: DoctorArray[] = [];
  doctorGroups: DoctorsGroups[] = [];
  draftAppointment: any;
  specialist!: Doctors | null;
  fees;
  hideHospitalOptions!: boolean;
  datePickerBox: any;
  mrn!: null;
  isNewPatient!: boolean;
  checkRegisteredPatient!: boolean;
  hideAppointmentOptions!: boolean;
  timeSlotAvailable = true;
  showSpinnerForSlotLoading = false;
  hospitalAccount: any;
  timeOut: any;
  selectedHospitalDetails!: { contactDetails: { phone: any } };
  consentForm: any;
  selectedFamilyMemberDetails!: { dob: any };
  isMobile = false;
  public devWidth = this.platform.width();
  isPaymentRequired: any;
  showAllSlots = false;
  readonly INITIAL_SLOTS_TO_SHOW = 24; // Show all or most slots by default (8 rows × 3 cols on mobile)

  ionViewWillEnter() {
    this.setPageTitle('Book Appointment');
    this.hideAppointmentOptions = false;
    this.hideHospitalOptions = false;

    // Check if consent form element exists before setting hidden property
    const consentForm = document.getElementById('showConsentForm');
    if (consentForm) {
      consentForm.hidden = false;
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
      });
    } catch (error) {
      // Error handling
    }

    // Set up back button handling with proper cleanup
    this.pageNavService.setupBackButton('/appointment-booking', () => {
      this.router.navigate(['appointment-list']);
    });
  }

  constructor(
    private httpService: HttpService,
    public utilityService: UtilityService,
    private navCtrl: NavController,
    private platform: Platform,
    private storageService: StorageService,
    private router: Router,
    private appointmentPaymentService: AppointmentPaymentService,
    public loadingController: LoadingController,
    private alertController: AlertController,
    private navService: NavigationService,
    private route: ActivatedRoute,
    private pageNavService: PageNavigationService,
    private globalFamilyMemberService: GlobalFamilyMemberService,
    private backButtonService: BackButtonService
  ) {
    if (this.devWidth < 770) {
      this.isMobile = true;
    }
    this.setPageTitle('Book Appointment');
    this.minAppointmentDate = new Date();
    this.relations = this.utilityService.getRelations();
    this.relations.shift();
    // // console.log('relation before : ', this.relations);
    this.user = this.storageService.get('user');

    try {
      this.draftAppointment =
        this.router.getCurrentNavigation()?.extras.state?.['draftAppointment'];
    } catch (error) {
      this.ngOnInit();
    }

    if (this.draftAppointment) {
      // // console.log('DraftAppointment', this.draftAppointment);
      this.hideHospital = false;
      this.isHidden = false;
      this.isHiddenFees = false;
      // // console.log('Appointment', this.draftAppointment.appointmentDetails);
      this.dateOfAppointment = this.draftAppointment.appointmentDate;
      this.getTimeSlot();

      if (this.draftAppointment.consultationCharge.code === 'VID_CONS') {
        this.videoConsultation = this.draftAppointment.consultationCharge;
        // // console.log('videoConsultation', this.videoConsultation);
        this.fees = this.draftAppointment.consultationCharge.price;
        this.consultationType.name =
          this.draftAppointment.consultationCharge.chargeName;
      } else {
        this.consultation =
          this.draftAppointment.appointmentDetails.consultationCharge;
      }
      // this.getConsultationFee();
      // this.getTime(this.data.appointmentDetails.appointmentTime);
      this.isVideo = this.draftAppointment.videoConsultation;
      // this.onChange(this.isVideo);

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

      // this.getSpecialists(hospitalInfo);
      this.getDoctors(hospitalInfo);
    }
  }
  setPageTitle(title: string) {
    this.navService.pageChange(title);
  }

  pickerOpen(picker: MatDatepicker<Date>) {
    this.datePickerBox = picker;
    this.datePickerBox.open();
    // // console.log('date opened', this.datePickerBox._dialogRef);
  }

  ionViewDidEnter() {
    // Register date picker close handler with BackButtonService
    this.backButtonService.registerPageHandler(this.router.url, () => {
      if (this.datePickerBox && this.datePickerBox.opened) {
        this.datePickerBox.close();
      } else {
        // Default back navigation if date picker is not open
        this.backButtonService.navigateBack();
      }
    });
  }

  ionViewWillLeave() {
    // Clean up the page handler when leaving
    this.backButtonService.unregisterPageHandler(this.router.url);

    // Hide consent form if it exists
    const consentForm = document.getElementById('showConsentForm');
    if (consentForm) {
      consentForm.hidden = true;
    }
  }

  openFamilyMemberPopUp() {
    this.hospital = null;
    this.doctor = null;
    this.specialist = null;
    this.dateOfAppointment = null;
    this.slots = undefined;
    this.timeOfAppointment = null;
    this.isVideo = false;
    // this.onChange(this.isVideo);
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

  getFamilyMemberId(familyMember: any) {
    this.hospital = null;
    this.doctor = null;
    this.specialist = null;
    this.dateOfAppointment = null;
    this.slots = undefined;
    this.timeOfAppointment = null;
    this.isVideo = false;
    // this.onChange(this.isVideo);
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

    // // console.log('Selected members phone : ', this.familyMemberName);
    if (!this.familyMemberPhone) {
      // // console.log('phone no not registered');
      this.familyMemberPhone = this.user.phone;
      // // console.log('Selected members phone : ', this.familyMemberPhone);
    }
    // // console.log('Selected patient :', this.familyMemberId);
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
        // // console.log('All family members', familyMembers);
        if (familyMembers !== '') {
          if (this.draftAppointment) {
            this.familyMembers.push(familyMembers);
            this.familyMember = this.familyMembers[0];
          } else {
            this.familyMembers = familyMembers;
            if (this.familyMembers.length === 1) {
              this.familyMember = this.familyMembers[0];
              this.hideHospital = false;
              this.getFamilyMemberId(this.familyMembers[0]);
            }
          }
        }
      })
      .catch((error) => {
        // // console.log('Fetching Error', error);
        // // console.log('No Family members Found');
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
        // // console.log('Fetching Error', error);
        // // console.log('No Family members Found');
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
          // // console.log('current user', user.data);

          if (user.data.preference.hospitalPreferences.length > 0) {
            let preferredHospitals = [];

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
            // // console.log('Preferred hospital array: ', this.hospitals);

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
        // console.error('Fetching Error', error);
        this.getHospitals();
      });
  }

  async getHospitals() {
    const getHospitalURL = '/hospital/?active=true';

    await this.httpService
      .get(getHospitalURL)
      .then((hospital) => {
        if (hospital && hospital.length > 0) {
          this.hospitals = hospital;
          return hospital;
        }
      })
      .catch((error) => {
        // Error loading hospitals
      });
  }

  async getHospitalsById(parentId: never) {
    // // console.log('Environment HospitalId', environment.HOSPITAL_ID);
    // // console.log('Parent Id', parentId);
    // let hospitalParentId = (parentId ? parentId : environment.HOSPITAL_ID);
    const getHospitalURL = '/hospital/?active=true';

    await this.httpService
      .get(getHospitalURL)
      .then((hospital) => {
        // // console.log('hospitals', hospital[0].code);
        if (hospital.length > 0) {
          // this.hospitals = datas;
          // tslint:disable-next-line:prefer-for-of
          for (let i = 0; i < hospital.length; i++) {
            if (hospital[i].parentId === parentId) {
              if (hospital[i].parentId !== hospital[i].entityId) {
                this.hospitals.push(hospital[i]);
              }
            }
          }
          // // console.log('hospital array : ', this.hospitals);
          return hospital;
        }
      })
      .catch((error) => {
        // // console.log('Error', error);
      });
  }

  async getSpecialists(hospital: {
    code: string | undefined;
    _id: any;
    name: any;
    paymentGatewayDetails: { key: any };
  }) {
    // this.specialities = null;
    this.doctor = null;
    this.dateOfAppointment = null;
    this.slots = undefined;
    this.timeOfAppointment = null;
    // this.isVideo = false;
    // this.onChange(this.isVideo);
    this.isHiddenFees = true;

    this.hospitalCode = hospital.code;
    this.hospitalId = hospital._id;
    this.hospitalName = hospital.name;
    this.gateWayKey = hospital.paymentGatewayDetails.key;
    // // console.log('hospital code ', this.hospitalCode);
    this.getFamilyMemberHospitalAccount();
    const getPatientsURL = '/speciality/?hospitalCode=' + this.hospitalCode;
    // const body = { hospitalCode: code };
    // // console.log('Hospital code : ', this.hospitalCode);

    await this.httpService
      .get(getPatientsURL)
      .then((specialty) => {
        // // console.log('All specialty', specialty.data.specialities);
        if (specialty !== '') {
          this.specialityList = specialty.data.specialities;
        }
        // // console.log('specialty array : ', this.specialityList);
      })
      .catch((error) => {
        // // console.log('Fetching Error', error);
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
          return;
        }

        // Filter doctors based on consultation type BEFORE storing
        if (this.isVideo === 'videoConsultation') {
          // Only show doctors who support video consultation
          doctorsArray = doctorsArray.filter(function (doctor: {
            canDoVideoConsultation: string;
          }) {
            return doctor.canDoVideoConsultation !== '0' && doctor.canDoVideoConsultation !== null;
          });
        } else if (this.isVideo === 'atTheHospital') {
          // Show all doctors for hospital visits (no filtering needed)
          // Just ensure the video consultation flag is set correctly
          doctorsArray = doctorsArray.map(function (doctor: any) {
            return {...doctor}; // Keep original data
          });
        }

        if (doctorsArray && doctorsArray.length > 0) {
          this.doctors = doctorsArray.slice(0);
          this.doctorArray = doctorsArray.slice(0);

          if (this.doctors.length >= 10) {
            this.isOptionGroup = false;
            this.isSingleDoctor = false;
          }

          if (this.doctors.length > 1 && this.doctors.length < 10) {
            this.isOptionGroup = true;
            this.isSingleDoctor = false;
            let doctors = this.doctors;

            let result = [
              ...new Set(
                doctors.map((speciality: any) => speciality.specialityName)
              ),
            ].map((speciality) => ({ name: speciality, doctors }));
            doctors.forEach((x) =>
              result.find((y) => y.name === x.specialityName)?.doctors.push(x)
            );
            this.doctorGroups = result;
          }

          if (this.doctors.length === 1) {
            this.isOptionGroup = false;
            this.isSingleDoctor = true;
            this.doctor = this.doctorArray[0];
            this.getCurrentDoctor(this.doctor);
          }

          if (this.draftAppointment) {
            for (let i = 0; i < this.doctors.length; i++) {
              if (
                this.doctors[i].specialityName ===
                this.draftAppointment.specialityName
              ) {
                this.specialist = this.doctors[i];
                break;
              }
            }

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
        // Error loading doctors
      });
  }

  getDoctorsArray(specialityCode: any, specialityName: any) {
    this.doctor = null;
    this.dateOfAppointment = null;
    this.slots = undefined;
    this.timeOfAppointment = null;
    // this.isVideo = false;
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

    console.log('getConsultationFee called with URL:', getDoctorURL);

    await this.httpService
      .get(getDoctorURL)
      .then((doctor) => {
        console.log('getConsultationFee response:', doctor);
        // Handle both response formats: direct data or wrapped in 'data' property
        if (doctor) {
          // Check if response has data wrapper
          const responseData = doctor.data || doctor;
          console.log('responseData:', responseData);

          this.consultation = responseData.consultationCharge;
          this.videoConsultation = responseData.videoConsultationCharge;

          console.log('Set consultation:', this.consultation);
          console.log('Set videoConsultation:', this.videoConsultation);
        }
      })
      .catch((error) => {
        console.error('getConsultationFee Error:', error);
      });
  }

  async getCurrentDoctor(doctor: any) {
    this.selectedDoctorData.doctorId = doctor.doctorId;
    this.selectedDoctorData.doctorName = doctor.doctorName;
    this.selectedDoctorData.canDoVideoConsultation =
      doctor.canDoVideoConsultation === '0' ? false : true;
    // this.selectedDoctorData.doctorId = (this.doctorId ? this.doctorId : this.draftAppointment.doctorId);
    this.specialityCode = doctor.specialityCode;
    this.specialityName = doctor.specialityName;
    // this.doctorName = (this.hospitalCode ? this.hospitalCode : this.draftAppointment.hospital.code);

    console.log('getCurrentDoctor - About to call getConsultationFee');
    console.log('doctorId:', this.selectedDoctorData.doctorId);
    console.log('hospitalCode:', this.hospitalCode);

    await this.getConsultationFee(
      this.selectedDoctorData.doctorId,
      this.hospitalCode
    );

    console.log('After getConsultationFee - consultation:', this.consultation);
    console.log('After getConsultationFee - videoConsultation:', this.videoConsultation);
    console.log('Current isVideo value:', this.isVideo);

    // // console.log('current doctorName ', this.selectedDoctorData.doctorName);
    this.dateOfAppointment = null;
    this.timeOfAppointment = null;
    //     if ( this.selectedDoctorData.canDoVideoConsultation =
    //       doctor.canDoVideoConsultation) {
    //         this.isVideo = "videoConsultation"
    //       }
    //       else {
    //  this.isVideo = null;
    //       }

    // this.onChange(this.isVideo);
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
      // this.isVideo = null;
      // this.onChange(this.isVideo);
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
      .get(getTimeSlotURL) // Family member filtering will be applied automatically by HttpService
      .then((timeSlot) => {
        // this.loadingDismiss();
        this.showSpinnerForSlotLoading = false;

        if (timeSlot) {
          // // console.log(timeSlot.data);

          if (
            timeSlot.data.Evening ||
            timeSlot.data.Night ||
            timeSlot.data.Afternoon ||
            timeSlot.data.Morning
          ) {
            this.timeSlotAvailable = true;
            this.isHidden = false;

            const noSlotsElement = document.getElementById('noSlotsAvailable');
            if (noSlotsElement) {
              noSlotsElement.textContent = null;
              noSlotsElement.style.marginTop = '0';
            }

            if (timeSlot.data.Evening) {
              // tslint:disable-next-line: prefer-for-of
              for (let i = 0; i < timeSlot.data.Evening.length; i++) {
                if (timeSlot.data.Evening[i].available === true) {
                  // // console.log(timeSlot.data.Evening[i].available);
                  // this.timeSlotEvening = timeSlot.data.Evening;
                  this.timeSlotEvening.push(timeSlot.data.Evening[i]);
                }
              }
            }
            if (timeSlot.data.Night) {
              // tslint:disable-next-line: prefer-for-of
              for (let i = 0; i < timeSlot.data.Night.length; i++) {
                if (timeSlot.data.Night[i].available === true) {
                  // this.timeSlotNight = timeSlot.data.Night;
                  this.timeSlotEvening.push(timeSlot.data.Night[i]);
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
            }
            if (timeSlot.data.Morning) {
              // tslint:disable-next-line: prefer-for-of
              for (let i = 0; i < timeSlot.data.Morning.length; i++) {
                if (timeSlot.data.Morning[i].available === true) {
                  // this.timeSlotMorning = timeSlot.data.Morning;
                  this.timeSlotMorning.push(timeSlot.data.Morning[i]);
                }
              }
            }
            // // console.log('Afternoon Time Slot', this.timeSlotAfternoon);
            // // console.log('Morning Time Slot true', this.timeSlotMorning);
            // // console.log('Morning Time Slot', timeSlot.data.Morning);
            // // console.log('Evening Time Slot', this.timeSlotEvening);
          } else {
            this.showSpinnerForSlotLoading = false;

            const noSlotsElement = document.getElementById('noSlotsAvailable');
            if (noSlotsElement) {
              noSlotsElement.textContent = 'No slots available';
              noSlotsElement.style.marginTop = '25%';
            }
            this.timeSlotAvailable = false;
            clearTimeout(this.timeOut);
            // this.utilityService.presentAlert('No Slots Available', 'Check for a different date.');
          }
        }
      })
      .catch((error) => {
        this.showSpinnerForSlotLoading = false;
        this.timeSlotAvailable = false;
        // console.error('Fetching Error', error);
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
      .get(getFamilyMemberHospitalAccountURL) // Family member filtering will be applied automatically by HttpService
      .then((hospitalAccount) => {
       // console.log('HospitalAccount', hospitalAccount);
        if (hospitalAccount.length > 0) {
          this.isHidden = false;
        } else {
          // this.checkRegisteredPatient = true;
          this.getHospitalAccountInformation();
          // this.isHidden = false;
          // this.isNewPatient = true;
        }
      })
      .catch((error) => {
        // console.error('Error', error);
      });
  }

  openLinkPatient() {
    // // console.log('HospitalAccountInformation', this.hospitalAccount);

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
      .get(getHospitalAccountInformationURL) // Family member filtering will be applied automatically by HttpService
      .then((hospitalAccount) => {
        this.checkRegisteredPatient = true;

        // // console.log('HospitalAccountInformation', hospitalAccount);

        if (
          hospitalAccount.data.patients &&
          hospitalAccount.data.patients.length > 0
        ) {
          this.hospitalAccount = hospitalAccount.data.patients;
          this.checkRegisteredPatient = true;
        } else {
          this.isNewPatient = false;
          this.isHidden = false;
          this.checkRegisteredPatient = false;
        }
      })
      .catch((error) => {
        // console.error('Error', error);
      });
  }

  async getConsultationType(event: string) {
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

    const noSlotsElement = document.getElementById('noSlotsAvailable');
    if (noSlotsElement) {
      noSlotsElement.textContent = null;
      noSlotsElement.style.marginTop = '0';
    }

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
    // // console.log(event);
    this.timeOfAppointment = null;

    if (event === 'Morning') {
      this.timeSlotArray = [];
      this.timeSlotArray = this.timeSlotMorning;
      // // console.log('If Morning', this.timeSlotArray);
    } else if (event === 'Afternoon') {
      this.timeSlotArray = [];
      this.timeSlotArray = this.timeSlotAfternoon;
      // // console.log('If Afternoon', this.timeSlotArray);
    } else {
      this.timeSlotArray = [];
      this.timeSlotArray = this.timeSlotEvening;
      // // console.log('If Evening', this.timeSlotArray);
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

  makePayment(appointment: any) {}

  ngOnInit() {
    this.hideProgressBar = true;
    this.setupGlobalFamilyMemberSubscription();
    this.getFamilyMembers();

    // Check if there's already a selected global family member
    const selectedMember = this.globalFamilyMemberService.getSelectedMember();
    if (selectedMember) {
      this.selectedGlobalFamilyMember = selectedMember;
      this.autoSelectGlobalFamilyMember(selectedMember);
      this.isFamilyMemberReadOnly = true;
      // Auto-skip to step 2 since family member is already selected
      this.currentStep = 2;
      this.highestStepReached = 2;
    } else {
      this.familyMember = (this.familyMembers as any)[''];
      // Start at step 1 to select family member
      this.currentStep = 1;
      this.highestStepReached = 1;
    }

    this.user = this.storageService.get('user');

    // Load hospitals
    if (environment.HOSPITAL_ID) {
      this.getHospitalsById(environment.HOSPITAL_ID);
    } else {
      this.showCorporateHospitals = true;
      this.getHospitals();
    }
  }

  ngOnDestroy() {
    // Clean up back button handler
    this.pageNavService.cleanupBackButton('/appointment-booking');
  }

  private setupGlobalFamilyMemberSubscription() {
    this.globalFamilyMemberService.selectedFamilyMember$.subscribe(
      (member: FamilyMember | null) => {
        // // console.log('Appointment booking - Global family member subscription triggered:', member?.fullName || 'None');
        this.selectedGlobalFamilyMember = member;
        // // console.log('Appointment booking - selectedGlobalFamilyMember updated to:', this.selectedGlobalFamilyMember);
        if (member) {
          // Auto-select the global family member and make it read-only
          this.autoSelectGlobalFamilyMember(member);
          this.isFamilyMemberReadOnly = true;
          // Reset form when family member changes
          this.resetAppointmentForm();
        } else {
          this.isFamilyMemberReadOnly = false;
        }
      }
    );

    this.globalFamilyMemberService.familyMembers$.subscribe(
      (members: FamilyMember[]) => {
        this.globalFamilyMembers = members;
        // // console.log('Appointment booking - Family members list updated:', members.length);
      }
    );
  }

  private autoSelectGlobalFamilyMember(globalMember: FamilyMember) {
    // Find matching family member in the local list
    const memberId = this.globalFamilyMemberService.getMemberId(globalMember);
    const matchingMember = this.familyMembers.find(fm =>
      (fm as any)._id === memberId ||
      (fm as any).id === memberId
    );

    if (matchingMember) {
      // Auto-select the matching family member
      this.familyMember = matchingMember;
      this.getFamilyMemberId(matchingMember);
      // // console.log('Auto-selected family member for appointment:', matchingMember.fullName);
    } else {
      // console.warn('Global family member not found in appointment family members list');
      // Still use the global member data for display
      this.familyMember = {
        _id: memberId,
        fullName: globalMember.fullName,
        phone: (globalMember as any).phone || this.user?.phone,
        dob: (globalMember as any).dob
      };
      this.getFamilyMemberId(this.familyMember);
    }

    // Enable the appointment form after auto-selection
    this.hideAppointmentOptions = false;
    // // console.log('Appointment form enabled after auto-selection');
  }

  private resetAppointmentForm() {
    // Reset form fields when family member changes
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
    // // console.log('Appointment form reset for new family member');
  }

  getInitials(fullName: string): string {
    if (!fullName) return '?';

    const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);
    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }

    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }

  // ===================================
  // 🎯 STEP MANAGEMENT METHODS
  // ===================================

  /**
   * Navigate to next step
   */
  nextStep() {
    if (this.canProceedToNextStep()) {
      this.currentStep++;
      // Track the highest step reached
      if (this.currentStep > this.highestStepReached) {
        this.highestStepReached = this.currentStep;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Navigate to previous step
   */
  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Check if user can proceed to next step based on current step validation
   */
  canProceedToNextStep(): boolean {
    switch (this.currentStep) {
      case 1: // Patient selection
        return !!(this.familyMemberId || this.selectedGlobalFamilyMember);
      case 2: // Consultation type
        return !!this.isVideo;
      case 3: // Hospital & Doctor
        return !!(this.hospital && this.doctor);
      case 4: // Date & Time
        return !!(this.dateOfAppointment && this.timeOfAppointment);
      default:
        return false;
    }
  }

  /**
   * Validate if a step has all required data
   */
  private isStepDataValid(step: number): boolean {
    switch (step) {
      case 1:
        return !!(this.familyMemberId || this.selectedGlobalFamilyMember);
      case 2:
        return !!this.isVideo;
      case 3:
        return !!(this.hospital && this.doctor);
      case 4:
        return !!(this.dateOfAppointment && this.timeOfAppointment);
      default:
        return false;
    }
  }

  /**
   * Recalculate the highest valid step based on current data
   */
  private recalculateHighestStep(): number {
    for (let step = 4; step >= 1; step--) {
      if (this.isStepDataValid(step)) {
        return step;
      }
    }
    return 1; // Default to step 1
  }

  // ===================================
  // 🔄 UI EVENT HANDLERS (New wrappers for existing logic)
  // ===================================

  /**
   * Handle family member selection from dropdown
   */
  onFamilyMemberSelect(member: any) {
    const previousMember = this.familyMemberId;
    this.getFamilyMemberId(member);

    // If changing an existing selection, reset later steps
    if (previousMember && previousMember !== member._id) {
      this.resetProgressFromStep(1);
    }

    // Removed auto-advancement - users now click Continue button
  }

  /**
   * Handle consultation type selection
   */
  selectConsultationType(type: string) {
    const previousType = this.isVideo;
    this.isVideo = type;
    this.getConsultationType(type);

    // If changing an existing selection, reset later steps
    if (previousType && previousType !== type) {
      this.resetProgressFromStep(2);
    }

    // Auto-advance to next step after consultation type selection (smoother flow)
    setTimeout(() => {
      if (this.currentStep === 2 && this.canProceedToNextStep()) {
        this.nextStep();
      }
    }, 600);
  }

  /**
   * Handle hospital selection
   */
  onHospitalSelect(hospital: any) {
    const previousHospital = this.hospital;
    this.getDoctors(hospital);

    // If changing an existing selection, reset later steps
    if (previousHospital && previousHospital._id !== hospital._id) {
      this.resetProgressFromStep(3);
    }
  }

  /**
   * Handle specialty selection
   */
  onSpecialtySelect(specialty: any) {
    this.getDoctorsArray(specialty.specialityCode, specialty.specialityName);
  }

  /**
   * Handle doctor selection
   */
  onDoctorSelect(doctor: any) {
    const previousDoctor = this.doctor;
    this.getCurrentDoctor(doctor);

    // If changing an existing selection, reset date/time
    if (previousDoctor && previousDoctor.doctorId !== doctor.doctorId) {
      this.dateOfAppointment = null;
      this.timeOfAppointment = null;
      this.slots = undefined;
      this.timeSlotArray = [];
      this.timeSlotMorning = [];
      this.timeSlotAfternoon = [];
      this.timeSlotEvening = [];
    }

    // Removed auto-advancement - users now click Continue button
  }

  /**
   * Handle date selection
   */
  onDateSelect() {
    this.getTimeSlot();
  }

  /**
   * Handle session selection (Morning/Afternoon/Evening)
   */
  onSessionSelect(session: string) {
    this.slots = session as any;
    this.showAllSlots = false; // Reset slot expansion when changing session
    this.onRadioSelected(session);
  }

  /**
   * Handle time slot selection
   */
  onTimeSlotSelect(slot: any) {
    this.timeOfAppointment = slot;
    this.scrollToBottom();
  }

  /**
   * Navigate to a specific step to review selections (no reset, no confirmation)
   */
  goToStep(targetStep: number) {
    // Don't allow navigation to current step
    if (targetStep === this.currentStep) {
      return;
    }

    // Only allow navigation to steps that have been reached in this session
    // Don't recalculate based on data - trust the session history
    // Data changes are handled by the selection handlers, not navigation
    if (targetStep > this.highestStepReached) {
      return;
    }

    // Reset slot expansion when navigating away from step 4
    if (this.currentStep === 4 && targetStep !== 4) {
      this.showAllSlots = false;
    }

    // Navigate to any previously reached step
    // Progress is NOT reset - user can review their selections
    // If they change something, the selection handlers will auto-reset later steps
    this.currentStep = targetStep;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Reset progress from a given step onwards
   */
  private resetProgressFromStep(step: number) {
    // Update highest step reached when resetting
    this.highestStepReached = step;

    switch (step) {
      case 1:
        // Reset everything after patient selection
        this.isVideo = null;
        this.hospital = null;
        this.doctor = null;
        this.specialist = null;
        this.dateOfAppointment = null;
        this.timeOfAppointment = null;
        this.slots = undefined;
        this.timeSlotArray = [];
        this.timeSlotMorning = [];
        this.timeSlotAfternoon = [];
        this.timeSlotEvening = [];
        this.doctors = [];
        this.doctorArray = [];
        this.isHiddenFees = true;
        this.showSpinnerForSlotLoading = false;
        break;

      case 2:
        // Reset everything after consultation type
        this.hospital = null;
        this.doctor = null;
        this.specialist = null;
        this.dateOfAppointment = null;
        this.timeOfAppointment = null;
        this.slots = undefined;
        this.timeSlotArray = [];
        this.timeSlotMorning = [];
        this.timeSlotAfternoon = [];
        this.timeSlotEvening = [];
        this.doctors = [];
        this.doctorArray = [];
        this.isHiddenFees = true;
        this.showSpinnerForSlotLoading = false;
        break;

      case 3:
        // Reset everything after doctor selection
        this.dateOfAppointment = null;
        this.timeOfAppointment = null;
        this.slots = undefined;
        this.timeSlotArray = [];
        this.timeSlotMorning = [];
        this.timeSlotAfternoon = [];
        this.timeSlotEvening = [];
        this.showSpinnerForSlotLoading = false;
        break;
    }
  }

  /**
   * Get visible time slots (limited or all)
   */
  getVisibleSlots(): TimeSlotArray[] {
    if (this.showAllSlots || this.timeSlotArray.length <= this.INITIAL_SLOTS_TO_SHOW) {
      return this.timeSlotArray;
    }
    return this.timeSlotArray.slice(0, this.INITIAL_SLOTS_TO_SHOW);
  }

  /**
   * Check if there are more slots to show
   */
  hasMoreSlots(): boolean {
    return this.timeSlotArray.length > this.INITIAL_SLOTS_TO_SHOW;
  }

  /**
   * Toggle showing all slots
   */
  toggleShowAllSlots() {
    this.showAllSlots = !this.showAllSlots;
  }

  }
