import { TestBed } from '@angular/core/testing';
import { DeviceWidthService } from './device-width.service';

describe('DeviceWidthService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DeviceWidthService = TestBed.inject(DeviceWidthService);
    expect(service).toBeTruthy();
  });
});