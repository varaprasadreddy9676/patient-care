import { Component, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdf-viewer-modal',
  templateUrl: './pdf-viewer-modal.component.html',
  styleUrls: ['./pdf-viewer-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PdfViewerModalComponent {
  @Input() pdfData: string = '';
  @Input() documentName: string = 'Document';

  safePdfUrl: SafeResourceUrl | null = null;

  constructor(
    private modalController: ModalController,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    // Ensure base64 string has proper data URL prefix
    let pdfDataUrl = this.pdfData;
    if (!pdfDataUrl.startsWith('data:')) {
      pdfDataUrl = `data:application/pdf;base64,${pdfDataUrl}`;
    }

    // Sanitize the URL for Angular security
    this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfDataUrl);
  }

  close() {
    this.modalController.dismiss();
  }
}
