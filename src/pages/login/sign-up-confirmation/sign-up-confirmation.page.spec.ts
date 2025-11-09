import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { SignUpConfirmationPage } from './sign-up-confirmation.page';

describe('SignUpConfirmationPage', () => {
  let component: SignUpConfirmationPage;
  let fixture: ComponentFixture<SignUpConfirmationPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), SignUpConfirmationPage],
    }).compileComponents();

    fixture = TestBed.createComponent(SignUpConfirmationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});