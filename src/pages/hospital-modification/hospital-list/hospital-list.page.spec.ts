import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { HospitalListPage } from './hospital-list.page';

describe('HospitalListPage', () => {
  let component: HospitalListPage;
  let fixture: ComponentFixture<HospitalListPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), HospitalListPage],
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});