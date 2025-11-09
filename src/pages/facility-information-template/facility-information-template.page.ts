import { UtilityService } from 'src/services/utility/utility.service';
import { StorageService } from './../../services/storage/storage.service';
import { HttpService } from 'src/services/http/http.service';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { PageNavigationService } from '../../services/navigation/page-navigation.service';
import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import {
  NavController,
  MenuController,
  Platform,
  IonicModule,
} from '@ionic/angular';
import Swiper from 'swiper';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-facility-information-template',
  templateUrl: './facility-information-template.page.html',
  styleUrls: ['./facility-information-template.page.scss'],
  standalone: true,
  imports: [IonicModule, NgFor, NgIf],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FacilityInformationTemplatePage implements OnInit, OnDestroy {
  user: any;
  userName: any;
  show = false;
  todayAppointments!: number;
  reminder!: number;

  @ViewChild('slideWithNav', { static: false }) slideWithNav!: ElementRef;
  private swiper?: Swiper;

  sliderOne: any;

  slideOptions = {
    initialSlide: 0,
    slidesPerView: 1,
    autoplay: true,
  };

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private storageService: StorageService,
    private httpService: HttpService,
    private menuCtrl: MenuController,
    private platform: Platform,
    private utilityService: UtilityService,
    private navService: NavigationService,
    private pageNavService: PageNavigationService
  ) {
    this.user = this.storageService.get('user');
    this.navService.pageChange('COVID Care');
    // // // console.log('home', this.user);
    this.show = false;
    this.sliderOne = {
      isBeginningSlide: true,
      isEndSlide: false,
      slidesItems: [
        {
          header: 'Slowdown the spread for virus',
          subHeader: '',
          list: [
            {
              item: 'Wear a mask that covers nose and mouth to protect yourself and others.',
            },
            { item: 'Maintain 6 feet distance from others.' },
            { item: 'Avoid crowds and poorly ventilated areas.' },
            { item: 'Wash your hands regularly.' },
          ],
        },
        {
          header: 'Slowdown the spread for virus',
          subHeader: '',
          list: [
            { item: 'Wear a N95 Mask or a double mask for protection.' },
            { item: 'Wash you hands regularly.' },
            { item: 'Get vaccinated.' },
          ],
        },
        {
          header: 'Symptoms of COVID-19',
          subHeader: 'Symptoms may appear 2-14 days after exposure to virus.',
          list: [
            { item: 'Cough.' },
            { item: 'Sore throat.' },
            { item: 'Loss of taste and smell.' },
            { item: 'Congestion or runny nose.' },
            { item: 'Consult a doctor if you have any of these symptoms.' },
          ],
        },
      ],
    };
  }

  ngOnInit() {
    // Initialize Swiper here if needed
  }

  ngAfterViewInit() {
    this.initSwiper();
  }

  private initSwiper() {
    this.swiper = new Swiper(this.slideWithNav.nativeElement, {
      ...this.slideOptions,
      on: {
        slideChange: () => this.onSlideChange(),
      },
    });
  }

  onSlideChange() {
    if (this.swiper) {
      this.sliderOne.isBeginningSlide = this.swiper.isBeginning;
      this.sliderOne.isEndSlide = this.swiper.isEnd;
    }
  }

  slideNext() {
    this.swiper?.slideNext();
  }

  slidePrev() {
    this.swiper?.slidePrev();
  }

  async goToHospitals(e: any) {
    await this.getFacilityDetails(e, 'COVID Care Hospitals');
  }

  async goToPharmacyStore(e: any) {
    await this.getFacilityDetails(e, 'Pharmacy Stores');
  }

  async goToOxygen(e: any) {
    await this.getFacilityDetails(e, 'Oxygen Cylinder Suppliers');
  }

  async goToAmbulance(e: any) {
    await this.getFacilityDetails(e, 'Book Ambulance');
  }

  async goToCollectSample(e: any) {
    await this.getFacilityDetails(e, 'COVID Test LABs');
  }

  goToOnlineConsultation() {
    // Implement if needed
  }

  async getFacilityDetails(facilityName: any, title: string) {
    const navigationExtras: NavigationExtras = {
      state: {
        name: facilityName,
        title: title,
      },
    };
    await this.router.navigate(
      ['/home/facility-information'],
      navigationExtras
    );
  }

  ionViewWillEnter() {
    this.menuCtrl.enable(true);
    this.navService.pageChange('COVID Care');
    this.user = this.storageService.get('user');
    // // // console.log('home', this.user);

    this.pageNavService.setupBackButton([
      {
        route: '/home',
        handler: () => (navigator as any)['app'].exitApp()
      },
      {
        route: '/facility-information-template',
        handler: () => this.router.navigate(['/home'])
      }
    ]);
  }

  ngOnDestroy() {
    this.pageNavService.cleanup();
  }
}