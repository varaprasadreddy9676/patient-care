import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrescriptionVisitsPage } from './prescription-visits.page';

describe('PrescriptionVisitsPage', () => {
  let component: PrescriptionVisitsPage;
  let fixture: ComponentFixture<PrescriptionVisitsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PrescriptionVisitsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
