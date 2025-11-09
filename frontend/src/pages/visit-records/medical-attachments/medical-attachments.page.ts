import { Component, OnInit, OnDestroy } from '@angular/core';
import { PageNavigationService } from '../../../services/navigation/page-navigation.service';
import { Router, NavigationExtras } from '@angular/router';
import { Platform, IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-medical-attachments',
  templateUrl: './medical-attachments.page.html',
  styleUrls: ['./medical-attachments.page.scss'],
  standalone: true,
  imports: [IonicModule],
})
export class MedicalAttachmentsPage implements OnInit, OnDestroy {
  navLinks: any[];
  familyMember: any;
  appointment: any;
  activeLink: any;

  constructor(
    private router: Router,
    private platform: Platform,
    private pageNavService: PageNavigationService
  ) {
    try {
      this.familyMember =
        this.router.getCurrentNavigation()?.extras.state?.['familyMember'];
      this.appointment =
        this.router.getCurrentNavigation()?.extras.state?.['appointment'];
    } catch (error) {}

    this.navLinks = [
      {
        label: 'ATTACHMENTS',
        link: 'attachment-list',
        index: 0,
      },
      {
        label: 'REPORTS',
        link: 'report-attachment-list',
        index: 1,
      },
    ];

    if (!this.appointment) {
      this.navLinks.push({
        label: 'VISIT RECORD',
        link: 'visits',
        index: 2,
      });
    }
  }
  ngOnInit(): void {}

  ngOnDestroy() {
    this.pageNavService.cleanup();
  }

  routeToPage(i: number) {
    this.activeLink = this.navLinks[i];
    let navigationExtras: NavigationExtras;

    if (this.appointment) {
      navigationExtras = {
        state: {
          familyMemberId: this.familyMember._id,
          appointment: this.appointment,
        },
      };
    } else {
      navigationExtras = {
        state: {
          familyMemberId: this.familyMember._id,
        },
      };
    }

    this.router.navigate(
      ['/home/medical-attachment/' + this.navLinks[i].link],
      navigationExtras
    );
  }

  ionViewWillEnter() {
    if (this.appointment) {
      this.routeToPage(0);
    } else {
      this.routeToPage(2);
    }

    this.pageNavService.setupBackButton(this.router.url, () => {
      if (this.appointment) {
        this.router.navigate(['/home/appointment-details']);
      } else {
        this.router.navigate(['home']);
      }
    });
  }
}