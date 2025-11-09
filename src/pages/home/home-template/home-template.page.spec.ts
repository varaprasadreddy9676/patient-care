import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { HomeTemplatePage } from './home-template.page';

describe('HomeTemplatePage', () => {
  let component: HomeTemplatePage;
  let fixture: ComponentFixture<HomeTemplatePage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), HomeTemplatePage],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeTemplatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});