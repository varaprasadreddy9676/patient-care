import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { BillDetailsPage } from './bill-details.page';

describe('BillDetailsPage', () => {
  let component: BillDetailsPage;
  let fixture: ComponentFixture<BillDetailsPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), BillDetailsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(BillDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});