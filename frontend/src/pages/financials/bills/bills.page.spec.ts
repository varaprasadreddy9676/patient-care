import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { BillsPage } from './bills.page';

describe('BillsPage', () => {
  let component: BillsPage;
  let fixture: ComponentFixture<BillsPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), BillsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(BillsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});