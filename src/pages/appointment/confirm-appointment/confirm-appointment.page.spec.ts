import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ConfirmAppointmentPage } from './confirm-appointment.page';

describe('ConfirmAppointmentPage', () => {
  let component: ConfirmAppointmentPage;
  let fixture: ComponentFixture<ConfirmAppointmentPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ConfirmAppointmentPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmAppointmentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});