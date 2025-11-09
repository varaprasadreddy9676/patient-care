import { DateService } from './../../../services/date/date.service';
import { StorageService } from 'src/services/storage/storage.service';
import { UtilityService } from 'src/services/utility/utility.service';
import { Component, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Platform, IonicModule } from '@ionic/angular';
import { HttpService } from 'src/services/http/http.service';
import { NavigationService } from '../../../services/navigation/navigation.service';
import { PageNavigationService } from '../../../services/navigation/page-navigation.service';
import { NgIf, NgFor } from '@angular/common';

interface ReportedIssues {
  issueDescription: any;
  status: string;
  reportedDate: any;
}

@Component({
  selector: 'app-service-requests',
  templateUrl: './service-requests.page.html',
  styleUrls: ['./service-requests.page.scss'],
  standalone: true,
  imports: [IonicModule, NgIf, RouterLink, NgFor],
})
export class ServiceRequestsPage implements OnDestroy {
  user;
  reportedIssues: ReportedIssues[] = [];

  constructor(
    private router: Router,
    private storageService: StorageService,
    private httpService: HttpService,
    private platform: Platform,
    private utilityService: UtilityService,
    private dateService: DateService,
    private navService: NavigationService,
    private pageNavService: PageNavigationService
  ) {
    this.navService.pageChange('Support');
    this.user = this.storageService.get('user');
  }

  deleteIssue(issue: any) {
    const url = '/customerReportedIssue/' + issue._id;

    this.httpService
      .deleteInBackground(url, true)
      .then((response) => {
        this.getReportedIssues();
      })
      .catch((error) => {
        // // // console.log('Error!', error.message);
        this.utilityService.presentAlert('Error!', error.message);
      });
  }

  async getReportedIssues() {
    const url = '/customerReportedIssue/?userId=' + this.user.id;

    this.httpService
      .getInBackground(url, true)
      .then((issues: any) => {
        this.reportedIssues = issues;
      })
      .catch((error) => {
        // // // console.log('Error!', error.message);
      });
  }

  toDBdateFormat(date: string | number | Date) {
    return this.dateService.toDBdateFormat(new Date(date));
  }

  getTime(time: string | number | Date) {
    try {
      const date = new Date(time);
      
      if (isNaN(date.getTime())) {
          throw new Error('Invalid date input');
      }

      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');

      const period = hours < 12 ? 'AM' : 'PM';
      const hours12 = hours % 12 || 12;
      const formattedHours = hours12.toString().padStart(2, '0');

      return `${formattedHours}:${minutes} ${period}`;
    } catch (error) {
        // // console.error('Error formatting time:', error);
        return 'Invalid time format';
    }
  }

  ionViewWillEnter() {
    this.navService.pageChange('Support');
    this.user = this.storageService.get('user');

    this.getReportedIssues();

    this.pageNavService.setupBackButton([
      {
        route: '/service-requests',
        handler: () => this.router.navigate(['home'])
      },
      {
        route: '/home/service-requests',
        handler: () => this.router.navigate(['/home'])
      }
    ]);
  }

  ngOnDestroy() {
    this.pageNavService.cleanup();
  }
}