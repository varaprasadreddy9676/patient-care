import { Router, RouterModule, NavigationExtras } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
})
export class FileUploadComponent implements OnInit {
  files: File[] = [];

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(private router: Router) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.classList.add('dragover');
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.classList.remove('dragover');
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.classList.remove('dragover');
    }

    const files = event.dataTransfer?.files;
    if (files) {
      this.navigateToUploadComponent(files);
    }
  }

  private navigateToUploadComponent(files: FileList) {
    const fileArray = Array.from(files);
    const fileData = fileArray.map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
    }));

    const navigationExtras: NavigationExtras = {
      state: { files: fileData },
    };

    this.router.navigate(['/home/attachment-list'], navigationExtras);
  }

  ngOnInit() {}
}