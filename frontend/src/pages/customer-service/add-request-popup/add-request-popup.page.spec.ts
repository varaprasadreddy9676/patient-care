import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AddRequestPopupPage } from './add-request-popup.page';

describe('AddRequestPopupPage', () => {
  let component: AddRequestPopupPage;
  let fixture: ComponentFixture<AddRequestPopupPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), AddRequestPopupPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AddRequestPopupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});