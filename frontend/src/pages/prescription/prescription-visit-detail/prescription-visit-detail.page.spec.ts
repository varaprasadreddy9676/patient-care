import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrescriptionVisitDetailPage } from './prescription-visit-detail.page';

describe('PrescriptionVisitDetailPage', () => {
  let component: PrescriptionVisitDetailPage;
  let fixture: ComponentFixture<PrescriptionVisitDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PrescriptionVisitDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
