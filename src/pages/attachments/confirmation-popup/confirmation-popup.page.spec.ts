import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ConfirmationPopupPage } from './confirmation-popup.page';

describe('ConfirmationPopupPage', () => {
  let component: ConfirmationPopupPage;
  let fixture: ComponentFixture<ConfirmationPopupPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ConfirmationPopupPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationPopupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});