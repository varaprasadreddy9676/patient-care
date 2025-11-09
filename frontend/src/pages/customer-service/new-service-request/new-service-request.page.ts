import { MatDialog } from '@angular/material/dialog';
import { AddRequestPopupPage } from './../add-request-popup/add-request-popup.page';
import { StorageService } from 'src/services/storage/storage.service';
import { UtilityService } from 'src/services/utility/utility.service';
import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Platform, IonicModule } from '@ionic/angular';
import { HttpService } from 'src/services/http/http.service';
import { PageNavigationService } from '../../../services/navigation/page-navigation.service';
import { NgFor, NgClass } from '@angular/common';

@Component({
  selector: 'app-new-service-request',
  templateUrl: './new-service-request.page.html',
  styleUrls: ['./new-service-request.page.scss'],
  standalone: true,
  imports: [IonicModule, NgFor, NgClass],
})
export class NewServiceRequestPage implements OnDestroy {
  user;
  issueSelected: any;
  issueList: any;

  constructor(
    private router: Router,
    private storageService: StorageService,
    private httpService: HttpService,
    private dialog: MatDialog,
    private platform: Platform,
    private utilityService: UtilityService,
    private pageNavService: PageNavigationService
  ) {
    this.user = this.storageService.get('user');
    this.getIssues();
  }

  async getIssues() {
    const url = '/customerIssue';

    this.httpService
      .get(url)
      .then((issues) => {
        this.issueList = issues;
      })
      .catch((error) => {
        // // // console.log('Error!', error.message);
      });
  }

  addRequest(issue: { _id: any }) {
    this.issueSelected = issue._id;
    const dialogRef = this.dialog.open(AddRequestPopupPage, {
      panelClass: ['custom-dialog-container'],
      data: {
        issue: issue,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      // // // console.log('The dialog was closed', result);
    });
  }

  ionViewWillEnter() {
    this.pageNavService.setupBackButton([
      {
        route: '/new-service-request',
        handler: () => this.router.navigate(['service-requests'])
      },
      {
        route: '/home/new-service-request',
        handler: () => this.router.navigate(['/home/service-requests'])
      }
    ]);
  }

  ngOnDestroy() {
    this.pageNavService.cleanup();
  }
}