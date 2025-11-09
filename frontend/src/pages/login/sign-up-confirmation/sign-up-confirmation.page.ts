import { Router, NavigationExtras } from '@angular/router';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { NgIf } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-sign-up-confirmation',
  templateUrl: './sign-up-confirmation.page.html',
  styleUrls: ['./sign-up-confirmation.page.scss'],
  standalone: true,
  imports: [
    CdkScrollable,
    MatDialogContent,
    NgIf,
    IonicModule,
    MatDialogClose,
    MatIcon,
  ],
})
export class SignUpConfirmationPage implements OnInit {
  phoneNumberSignUp: any;
  phoneNumberSignIn: any;
  constructor(
    @Inject(MAT_DIALOG_DATA)
    private data: any,
    private dialogRef: MatDialogRef<SignUpConfirmationPage>,
    private router: Router
  ) {}

  goToRegister() {
    this.dialogRef.close();
    const navigationExtras: NavigationExtras = {
      state: {
        phone: this.phoneNumberSignUp,
      },
    };
    this.router.navigate(['sign-up'], navigationExtras);
  }

  goToSignIn() {
    this.dialogRef.close();
    const navigationExtras: NavigationExtras = {
      queryParams: {
        phone: this.phoneNumberSignIn,
      },
      replaceUrl: true,
    };
    this.router.navigate(['sign-in'], navigationExtras);
  }

  ngOnInit() {
    this.phoneNumberSignUp = this.data.phone;
    // // // console.log(this.phoneNumberSignUp);

    this.phoneNumberSignIn = this.data.phoneNumber;
    // // // console.log(this.phoneNumberSignIn);
  }
}