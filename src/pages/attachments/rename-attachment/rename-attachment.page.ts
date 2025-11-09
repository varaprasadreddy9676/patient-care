import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { UtilityService } from './../../../services/utility/utility.service';
import { HttpService } from './../../../services/http/http.service';
import { Router } from '@angular/router';
import { DomSanitizer } from "@angular/platform-browser";
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rename-attachment',
  templateUrl: './rename-attachment.page.html',
  styleUrls: ['./rename-attachment.page.scss'],
  standalone : true,
  imports : [
    MatSelect,
    IonicModule,
    CommonModule,
    FormsModule
  ]
})
export class RenameAttachmentPage implements OnInit {
  attachment: any;
  fileNames: any;
  isFileNameExists = false;
  fileName;
  constructor(
    @Inject(MAT_DIALOG_DATA)
    private data: any,
    private dialogRef: MatDialogRef<RenameAttachmentPage>,
    private utilityService: UtilityService,
    private httpService: HttpService,
    private router: Router,
    private domSanitizer: DomSanitizer,
  ) 
  { 

    if (this.data) {
      // // // console.log('Received Attachment Details: ', this.data.attachmentDetails);
      this.attachment = this.data.attachmentDetails;
      this.fileNames = this.data.attached;
      this.isFileNameExists = this.data.exist;
      this.fileName = this.attachment.fileName
    }

  }

  ngOnInit() {

  }
  
  sanitizeURI(base64URI: string) {
    return this.domSanitizer.bypassSecurityTrustResourceUrl(base64URI);
  }

  closeDialog() {
    this.dialogRef.close(null);
  }

  saveDialog () {
    this.dialogRef.close(this.attachment);
  }
  

}
