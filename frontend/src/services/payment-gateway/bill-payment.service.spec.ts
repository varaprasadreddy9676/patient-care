import { TestBed } from '@angular/core/testing';
import { BillPaymentService } from './bill-payment.service';

describe('BillPaymentService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BillPaymentService = TestBed.inject(BillPaymentService);
    expect(service).toBeTruthy();
  });
});