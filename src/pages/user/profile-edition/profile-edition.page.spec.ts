import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ProfileEditionPage } from './profile-edition.page';

describe('ProfileEditionPage', () => {
  let component: ProfileEditionPage;
  let fixture: ComponentFixture<ProfileEditionPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ProfileEditionPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileEditionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});