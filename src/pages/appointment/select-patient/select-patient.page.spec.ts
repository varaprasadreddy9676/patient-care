import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { SelectPatientPage } from './select-patient.page';

describe('SelectPatientPage', () => {
  let component: SelectPatientPage;
  let fixture: ComponentFixture<SelectPatientPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), SelectPatientPage],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectPatientPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});