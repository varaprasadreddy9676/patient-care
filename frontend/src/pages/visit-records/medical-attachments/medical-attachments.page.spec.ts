import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { MedicalAttachmentsPage } from './medical-attachments.page';

describe('MedicalAttachmentsPage', () => {
  let component: MedicalAttachmentsPage;
  let fixture: ComponentFixture<MedicalAttachmentsPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), MedicalAttachmentsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(MedicalAttachmentsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});