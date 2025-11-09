import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AttachmentListPage } from './attachment-list.page';

describe('AttachmentListPage', () => {
  let component: AttachmentListPage;
  let fixture: ComponentFixture<AttachmentListPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), AttachmentListPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AttachmentListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});