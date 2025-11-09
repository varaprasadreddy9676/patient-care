import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ModifyHospitalPage } from './modify-hospital.page';

describe('ModifyHospitalPage', () => {
  let component: ModifyHospitalPage;
  let fixture: ComponentFixture<ModifyHospitalPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ModifyHospitalPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ModifyHospitalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});