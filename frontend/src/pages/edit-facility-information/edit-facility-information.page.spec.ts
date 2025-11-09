import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { EditFacilityInformationPage } from './edit-facility-information.page';

describe('EditFacilityInformationPage', () => {
  let component: EditFacilityInformationPage;
  let fixture: ComponentFixture<EditFacilityInformationPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), EditFacilityInformationPage],
    }).compileComponents();

    fixture = TestBed.createComponent(EditFacilityInformationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});