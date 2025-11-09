import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TokenVerificationPage } from './token-verification.page';

describe('TokenVerificationPage', () => {
  let component: TokenVerificationPage;
  let fixture: ComponentFixture<TokenVerificationPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), TokenVerificationPage],
    }).compileComponents();

    fixture = TestBed.createComponent(TokenVerificationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});