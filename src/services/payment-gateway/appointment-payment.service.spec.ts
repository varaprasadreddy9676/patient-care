import { TestBed } from '@angular/core/testing';
import { AppointmentPaymentService } from './appointment-payment.service';

describe('AppointmentPaymentService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AppointmentPaymentService = TestBed.inject(
      AppointmentPaymentService
    );
    expect(service).toBeTruthy();
  });
});