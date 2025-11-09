import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { HospitalPreferencePage } from './hospital-preference.page';

describe('HospitalPreferencePage', () => {
  let component: HospitalPreferencePage;
  let fixture: ComponentFixture<HospitalPreferencePage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), HospitalPreferencePage],
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalPreferencePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});