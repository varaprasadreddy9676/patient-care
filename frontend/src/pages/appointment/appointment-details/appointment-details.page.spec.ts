import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AppointmentDetailsPage } from './appointment-details.page';

describe('AppointmentDetailsPage', () => {
  let component: AppointmentDetailsPage;
  let fixture: ComponentFixture<AppointmentDetailsPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), AppointmentDetailsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});