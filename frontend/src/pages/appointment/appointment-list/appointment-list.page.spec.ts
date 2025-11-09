import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AppointmentListPage } from './appointment-list.page';

describe('AppointmentListPage', () => {
  let component: AppointmentListPage;
  let fixture: ComponentFixture<AppointmentListPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), AppointmentListPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});