import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AppointmentBookingPage } from './appointment-booking.page';

describe('AppointmentBookingPage', () => {
  let component: AppointmentBookingPage;
  let fixture: ComponentFixture<AppointmentBookingPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), AppointmentBookingPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentBookingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});