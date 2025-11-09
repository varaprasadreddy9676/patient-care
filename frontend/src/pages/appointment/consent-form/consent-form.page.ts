import { StorageService } from './../../../services/storage/storage.service';
import { HttpService } from './../../../services/http/http.service';
import { Router, NavigationExtras } from '@angular/router';
import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { Platform, IonicModule } from '@ionic/angular';
import { CommonModule, Location, NgIf } from '@angular/common';
import { MatLabel, MatFormField } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatOption } from '@angular/material/core';
import { MatButton } from '@angular/material/button';
import { PageNavigationService } from '../../../services/navigation/page-navigation.service';
// import { Camera, CameraOptions } from "@ionic-native/camera/ngx";

interface TemplateLanguages {
  language: any;
}

@Component({
  selector: 'app-consent-form',
  templateUrl: './consent-form.page.html',
  styleUrls: ['./consent-form.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    NgIf,
    MatLabel,
    MatFormField,
    MatSelect,
    FormsModule,
    MatOption,
    MatButton,
    CommonModule,
  ],
})
export class ConsentFormPage implements OnInit, OnDestroy {
  details: any;
  consentForm: any;
  user;
  templateLanguages: TemplateLanguages[] = [];
  selectedLanguage: any;

  constructor(
    private httpService: HttpService,
    private router: Router,
    private storageService: StorageService,
    private platform: Platform,
    private location: Location,
    private pageNavService: PageNavigationService
  ) {
    // // // console.log(this.router.getCurrentNavigation()?.extras.state?.['details']);
    this.details =
      this.router.getCurrentNavigation()?.extras.state?.['details'];
    this.getConsentForm('ENGLISH');
    this.getTemplateLanguages();
    this.user = this.storageService.get('user');
  }

  async getTemplateLanguages() {
    const url =
      '/consentFormMaster/templateLanguages/?hospitalCode=' +
      this.details.hospitalCode +
      '&cft=VIDEO_CONSULTATION';

    await this.httpService
      .getInBackground(url, true)
      .then((language: any) => {
        if (language.length > 0) {
          this.templateLanguages = language;
        } else {
          this.templateLanguages.push({ language: 'ENGLISH' });
        }

        // tslint:disable-next-line:max-line-length
        this.selectedLanguage =
          this.templateLanguages[
            this.templateLanguages.findIndex(
              (templateLanguages: any) =>
                templateLanguages.language === 'ENGLISH'
            )
          ];
        // // // console.log(this.templateLanguages);
      })
      .catch((error) => {
        // // // console.log('Error!', error.message);
      });
  }

  async getConsentForm(templateLanguage: string) {
    let spec = '';
    try {
      spec = this.details.speciality.replace('&', 'and');
    } catch (e) {
      // // console.error(e);
    }
    const placeholderData = {
      SPECIALITY: spec,
      DOCTOR_NAME: this.details.doctorName,
      CONTACT_NUMBER: this.details.hospitalContactNumber,
      HOSPITAL_NAME: this.details.hospitalName,
    };

    const url =
      '/consentFormMaster/?hospitalCode=' +
      this.details.hospitalCode +
      '&cft=VIDEO_CONSULTATION&lang=' +
      templateLanguage +
      '&pd=' +
      JSON.stringify(placeholderData);

    await this.httpService
      .getInBackground(url, true)
      .then((consentForm) => {
        this.consentForm = consentForm;

        // // // console.log(this.consentForm);
      })
      .catch((error) => {
        // // // console.log('Error!', error.message);
      });
  }

  async consentAction(action: string) {
    this.consentForm.status = action;

    if (action === 'AGREED') {
      const navigationExtras: NavigationExtras = {
        state: {
          appointment: this.details.appointment,
          consentForm: this.consentForm,
        },
      };
      this.router.navigate(['/home/confirm-appointment'], navigationExtras);
    } else {
      this.location.back();
      // this.router.navigate(["/home/appointment-booking"]);
    }
  }

  ionViewWillEnter() {
    document.getElementById('agree')!.hidden = false;
    document.getElementById('decline')!.hidden = false;

    this.pageNavService.setupBackButton('/consent-form', () => {
      this.location.back();
    });
    this.pageNavService.setupBackButton('/home/consent-form', () => {
      this.location.back();
    });
  }

  ionViewWillLeave() {
    document.getElementById('agree')!.hidden = true;
    document.getElementById('decline')!.hidden = true;
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.pageNavService.cleanupBackButton('/consent-form');
    this.pageNavService.cleanupBackButton('/home/consent-form');
  }
}