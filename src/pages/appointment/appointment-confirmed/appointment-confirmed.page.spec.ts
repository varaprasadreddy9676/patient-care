import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AppointmentConfirmedPage } from './appointment-confirmed.page';

describe('AppointmentConfirmedPage', () => {
  let component: AppointmentConfirmedPage;
  let fixture: ComponentFixture<AppointmentConfirmedPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), AppointmentConfirmedPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentConfirmedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});