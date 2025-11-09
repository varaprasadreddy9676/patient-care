import { Component, OnInit } from '@angular/core';
import { Platform, IonicModule } from '@ionic/angular';
import { NavigationService } from 'src/services/navigation/navigation.service';
import { RouterModule, RouterOutlet } from '@angular/router';
import { HeaderProfileComponent } from '../header-profile/header-profile.component';
import { FooterNavigationComponent } from 'src/app/shared/components/footer-navigation/footer-navigation.component';

@Component({
  selector: 'app-home-template',
  templateUrl: './home-template.page.html',
  styleUrls: ['./home-template.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    RouterOutlet,
    RouterModule,
    HeaderProfileComponent,
    FooterNavigationComponent,
  ],
})
export class HomeTemplatePage implements OnInit {
  public devWidth;

  constructor(
    private platform: Platform,
    private navService: NavigationService
  ) {
    this.devWidth = this.platform.width();
    // // // console.log('Device Width: ' + this.devWidth);
  }

  ngOnInit() {}
}
