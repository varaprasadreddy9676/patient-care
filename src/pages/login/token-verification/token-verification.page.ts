import { StorageService } from './../../../services/storage/storage.service';
import { UtilityService } from './../../../services/utility/utility.service';
import { HttpService } from './../../../services/http/http.service';
import { PushNotificationService } from './../../../services/push-notification.service';
import { BackButtonService } from './../../../services/navigation/backButton/back-button.service';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, NavController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { NgIf } from '@angular/common';
import { Clipboard } from '@capacitor/clipboard';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-token-verification',
  templateUrl: './token-verification.page.html',
  styleUrls: ['./token-verification.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    FormsModule,
    MatFormField,
    MatInput,
    NgIf,
  ],
})
export class TokenVerificationPage implements OnInit, OnDestroy {
  @ViewChild('ngOtpInput', { static: false }) ngOtpInput: any;
  OTP: string = '';
  hidePassword = true;
  enteredOtp: any;
  onSubmit: boolean;
  profileId: string;
  onResend: boolean;
  public smsTextmessage = '';
  otpMessage: string[] = [];
  showSpinner: boolean;
  resendAvailable = false;
  resendCountdown = 30;
  resendCountdownDisplay = '00:30';
  readonly otpExpiryHint = 'The OTP will expire in 5 minutes.';
  private countdownInterval?: ReturnType<typeof setInterval>;

  constructor(
    private httpService: HttpService,
    private router: Router,
    private utilityService: UtilityService,
    private storageService: StorageService,
    private platform: Platform,
    private pushNotificationService: PushNotificationService,
    private navCtrl: NavController,
    private backButtonService: BackButtonService
  ) {
    this.onSubmit = false;
    this.onResend = false;
    this.showSpinner = false;

    // Get profileId from navigation state
    const navigation = this.router.getCurrentNavigation();
    this.profileId = navigation?.extras?.state?.['profileId'] || '';

    this.updateResendCountdownDisplay();
  }

  get stageChipLabel(): string {
    return 'Step 2 of 2 - Confirm OTP';
  }

  async resendOTP() {
    if (!this.resendAvailable || this.showSpinner) {
      return;
    }

    this.enteredOtp = null;
    this.showSpinner = false;
    this.onSubmit = false;
    this.onResend = false;
    this.resendAvailable = false;
    const resendOtpURL =
      '/signup/resendOTP/' +
      this.profileId +
      '?appHashCode=' +
      this.utilityService.appHashCode;
    await this.httpService
      .get(resendOtpURL)
      .then((datas) => {
        if (datas.data.profileId != null) {
          this.onResend = true;
          this.startResendCountdown();
          this.getSMS('resend');
          // // // console.log('Resend Success', datas);
        } else {
          this.resendAvailable = true;
          this.resendCountdown = 0;
          this.updateResendCountdownDisplay();
          this.utilityService.presentAlert(
            'Resend Error',
            'Unable to fetch OTP.'
          );
        }
        // // // console.log('Resend Success', datas);
      })
      .catch((error) => {
        // // // console.log('Resend Error', error);
        this.resendAvailable = true;
        this.resendCountdown = 0;
        this.updateResendCountdownDisplay();
      });
  }

  async verifyOTP() {
    this.onSubmit = false;
    this.onResend = false;
    this.showSpinner = true;
    const verifyOtpURL = '/signup/verifyOTP';

    await this.httpService
      .put(verifyOtpURL, this.otpBody())
      .then(async (user) => {
        if (user.id) {
          // // // console.log('OTP verification successful for user :', user);

          this.storageService.set('user', user, true);

          // Initialize push notifications after successful login
          if (this.pushNotificationService.isPushNotificationSupported()) {
            try {
              await this.pushNotificationService.initPushNotifications(user.id);
              // // // console.log('Push notifications initialized for user:', user.id);
            } catch (error) {
              // // console.error('Error initializing push notifications:', error);
            }
          }

          // Clear navigation history to prevent back navigation to login screens
          this.clearCountdown();
          this.backButtonService.clearRouteHistory();

          // Use navigateRoot to replace the entire navigation stack
          this.navCtrl.navigateRoot('/home', { replaceUrl: true });
        } else {
          this.showSpinner = false;
          this.onSubmit = true;
          this.enteredOtp = null;
          //  this.setOtpValue(0);
        }
      })
      .catch((error) => {
        // // // console.log('Error in getting user details for dashboard', error);
        this.showSpinner = false;
        this.onSubmit = true;
        this.enteredOtp = null;
        // this.setOtpValue(0);
      });
  }

  onOtpChange(otp: string) {
    // tslint:disable-next-line: radix
    this.enteredOtp = Number.parseInt(otp);
  }

  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text');
    if (pastedText) {
      const otpMatch = pastedText.match(/\d{4}/);
      if (otpMatch) {
        this.enteredOtp = otpMatch[0];
        // // // console.log('OTP pasted:', otpMatch[0]);
        // Auto verify after paste
        setTimeout(() => this.verifyOTP(), 500);
      }
    }
  }

  onOtpInput(event: any) {
    const value = event.target.value;
    if (value && value.length === 4) {
      // Auto verify when 4 digits entered
      setTimeout(() => this.verifyOTP(), 500);
    }
  }

  goBackToSignIn() {
    this.navCtrl.navigateBack('/sign-in');
  }

  private startResendCountdown(duration: number = 30) {
    this.clearCountdown();
    this.resendAvailable = false;
    this.resendCountdown = duration;
    this.updateResendCountdownDisplay();

    this.countdownInterval = setInterval(() => {
      if (this.resendCountdown <= 1) {
        this.clearCountdown();
        this.resendCountdown = 0;
        this.resendAvailable = true;
        this.updateResendCountdownDisplay();
      } else {
        this.resendCountdown -= 1;
        this.updateResendCountdownDisplay();
      }
    }, 1000);
  }

  private updateResendCountdownDisplay() {
    const seconds = Math.max(this.resendCountdown, 0);
    this.resendCountdownDisplay = `00:${seconds.toString().padStart(2, '0')}`;
  }

  private clearCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = undefined;
    }
  }

  otpBody() {
    return {
      profileId: this.profileId,
      otp: parseInt(this.enteredOtp),
      playerId: this.utilityService.playerId,
    };
  }

  setOtpValue(value: number | String) {
    this.ngOtpInput.setValue(value);
  }

  async getSMS(callBackFunction: string) {
    if (callBackFunction === 'resend') {
      setTimeout(() => {
        this.onResend = false;
        this.showSpinner = false;
      }, 3000);
    }

    // Check clipboard for OTP on native platforms
    if (this.platform.is('capacitor')) {
      this.startClipboardWatcher();
    }

    // Also listen for paste events - delay to ensure DOM is ready
    setTimeout(() => {
      this.setupPasteListener();
    }, 100);
  }

  private async startClipboardWatcher() {
    // Check clipboard periodically for OTP
    const checkClipboard = async () => {
      try {
        const result = await Clipboard.read();
        if (result.value) {
          const otpMatch = result.value.match(/\b\d{4}\b/);
          if (otpMatch && !this.enteredOtp) {
            const otp = otpMatch[0];
            this.enteredOtp = otp;
            // // // console.log('OTP auto-filled from clipboard:', otp);
            // Auto verify if OTP length is 4
            if (otp.length === 4) {
              setTimeout(() => this.verifyOTP(), 1000);
            }
          }
        }
      } catch (error) {
        // // // console.log('Clipboard access error:', error);
      }
    };

    // Check clipboard immediately and then every 2 seconds for 30 seconds
    checkClipboard();
    const interval = setInterval(checkClipboard, 2000);
    setTimeout(() => clearInterval(interval), 30000);
    
    // Also check clipboard immediately when the input field is focused
    const otpInput = document.getElementById('otp-input');
    if (otpInput) {
      otpInput.addEventListener('focus', () => {
        checkClipboard();
      });
    }
  }

  private setupPasteListener() {
    // Create a more specific paste listener for the OTP input
    const otpInput = document.getElementById('otp-input');
    if (otpInput) {
      otpInput.addEventListener('paste', (event: any) => {
        event.preventDefault();
        const pastedText = event.clipboardData?.getData('text');
        if (pastedText) {
          const otpMatch = pastedText.match(/\b\d{4}\b/);
          if (otpMatch) {
            this.enteredOtp = otpMatch[0];
            // // // console.log('OTP auto-filled from paste:', otpMatch[0]);
            // Auto verify after paste
            setTimeout(() => this.verifyOTP(), 500);
          }
        }
      });
    }
  }

  ngOnInit() {
    this.showSpinner = false;
    this.startResendCountdown();
    this.getSMS('');
    
    // Also check for SMS autofill on supported platforms
    if ('sms' in navigator) {
      this.setupSMSReceiver();
    }
  }

  ngOnDestroy() {
    this.clearCountdown();
  }

  private setupSMSReceiver() {
    // Modern SMS Receiver API for web browsers
    if ('sms' in navigator) {
      try {
        (navigator as any).sms.addEventListener('received', (event: any) => {
          const sms = event.message;
          const otpMatch = sms.match(/\b\d{4}\b/);
          if (otpMatch && !this.enteredOtp) {
            this.enteredOtp = otpMatch[0];
            // // // console.log('OTP auto-filled from SMS:', otpMatch[0]);
            // Auto verify if OTP length is 4
            if (otpMatch[0].length === 4) {
              setTimeout(() => this.verifyOTP(), 1000);
            }
          }
        });
      } catch (error) {
        // // // console.log('SMS Receiver API not available:', error);
      }
    }
  }
}
