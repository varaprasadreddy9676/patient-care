import { TestBed } from '@angular/core/testing';
import { BrowserService } from './browser-service.service';

describe('BrowserServiceService', () => {
  let service: BrowserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BrowserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});