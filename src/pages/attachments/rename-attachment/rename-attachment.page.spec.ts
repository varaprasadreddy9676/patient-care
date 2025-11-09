import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { RenameAttachmentPage } from './rename-attachment.page';

describe('RenameAttachmentPage', () => {
  let component: RenameAttachmentPage;
  let fixture: ComponentFixture<RenameAttachmentPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), RenameAttachmentPage],
    }).compileComponents();

    fixture = TestBed.createComponent(RenameAttachmentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});