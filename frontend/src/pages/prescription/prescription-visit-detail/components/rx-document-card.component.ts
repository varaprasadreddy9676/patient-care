import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'rx-document-card',
  templateUrl: './rx-document-card.component.html',
  styleUrls: ['./rx-document-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class RxDocumentCardComponent {
  @Input() doc: any; // Uses the existing DocumentItem interface from the page
  @Output() view = new EventEmitter<any>();
  @Output() download = new EventEmitter<any>();

  onView(event: Event) {
    event.stopPropagation();
    this.view.emit(this.doc);
  }

  onDownload(event: Event) {
    event.stopPropagation();
    this.download.emit(this.doc);
  }
}
