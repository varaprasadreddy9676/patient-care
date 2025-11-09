import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { PrescriptionPage } from './prescription.page';

describe('PrescriptionPage', () => {
  let component: PrescriptionPage;
  let fixture: ComponentFixture<PrescriptionPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), PrescriptionPage],
    }).compileComponents();

    fixture = TestBed.createComponent(PrescriptionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});