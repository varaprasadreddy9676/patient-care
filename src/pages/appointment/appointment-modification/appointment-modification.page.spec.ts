import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AppointmentModificationPage } from './appointment-modification.page';

describe('AppointmentModificationPage', () => {
  let component: AppointmentModificationPage;
  let fixture: ComponentFixture<AppointmentModificationPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), AppointmentModificationPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentModificationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});