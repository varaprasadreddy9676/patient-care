import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { visitDetailsPage } from './visit-details.page';

describe('FacilityInformationTemplatePage', () => {
  let component: visitDetailsPage;
  let fixture: ComponentFixture<visitDetailsPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), visitDetailsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(visitDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
