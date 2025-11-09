import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { visitsPage } from './visits.page';

describe('FacilityInformationTemplatePage', () => {
  let component: visitsPage;
  let fixture: ComponentFixture<visitsPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), visitsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(visitsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
