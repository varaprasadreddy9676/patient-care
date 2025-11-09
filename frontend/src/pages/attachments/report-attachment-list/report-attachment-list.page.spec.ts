import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ReportAttachmentListPage } from './report-attachment-list.page';

describe('ReportAttachmentListPage', () => {
  let component: ReportAttachmentListPage;
  let fixture: ComponentFixture<ReportAttachmentListPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ReportAttachmentListPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportAttachmentListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});