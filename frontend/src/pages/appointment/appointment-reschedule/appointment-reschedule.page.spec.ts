import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AppointmentReschedulePage } from './appointment-reschedule.page';

describe('AppointmentReschedulePage', () => {
  let component: AppointmentReschedulePage;
  let fixture: ComponentFixture<AppointmentReschedulePage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), AppointmentReschedulePage],
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentReschedulePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});