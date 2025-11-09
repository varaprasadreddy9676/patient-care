import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { FacilityInformationTemplatePage } from './facility-information-template.page';

describe('FacilityInformationTemplatePage', () => {
  let component: FacilityInformationTemplatePage;
  let fixture: ComponentFixture<FacilityInformationTemplatePage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), FacilityInformationTemplatePage],
    }).compileComponents();

    fixture = TestBed.createComponent(FacilityInformationTemplatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});