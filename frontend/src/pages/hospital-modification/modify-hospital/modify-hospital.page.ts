import { UtilityService } from './../../../services/utility/utility.service';
import { HttpService } from './../../../services/http/http.service';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { NgIf } from '@angular/common';
import { MatSlideToggle } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-modify-hospital',
  templateUrl: './modify-hospital.page.html',
  styleUrls: ['./modify-hospital.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    FormsModule,
    MatFormField,
    MatInput,
    NgIf,
    MatError,
    MatSlideToggle,
  ],
})
export class ModifyHospitalPage implements OnInit {
  hospitalName: any;
  hospitalAddress: any;
  mapGeographicPoints: any;
  contactNumber: any;
  active: any;
  hospital: any;
  disableSaveButton = false;
  contactDetails: any;

  constructor(
    private utilityService: UtilityService,
    private httpService: HttpService,
    private router: Router
  ) {}

  async saveHospital() {
    this.disableSaveButton = true;

    const hospitalMappingURL = '/hospital/' + this.hospital._id;

    await this.httpService
      .put(hospitalMappingURL, this.hospital)
      .then((mapping) => {
        this.router.navigate(['/home/hospital-list']);
      })
      .catch((error) => {
        this.disableSaveButton = false;
        // // console.error('Edit Error', error);
        this.utilityService.presentAlert('Error!', error.message);
      });
  }

  ngOnInit() {
    this.hospital =
      this.router.getCurrentNavigation()?.extras.state?.['hospital'];
    // // // console.log(this.hospital);
  }
}