import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { FacilityInformationPage } from './facility-information.page';

describe('FacilityInformationPage', () => {
  let component: FacilityInformationPage;
  let fixture: ComponentFixture<FacilityInformationPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), FacilityInformationPage],
    }).compileComponents();

    fixture = TestBed.createComponent(FacilityInformationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});