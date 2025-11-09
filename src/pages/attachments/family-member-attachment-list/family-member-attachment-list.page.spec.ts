import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { FamilyMemberAttachmentListPage } from './family-member-attachment-list.page';

describe('FamilyMemberAttachmentListPage', () => {
  let component: FamilyMemberAttachmentListPage;
  let fixture: ComponentFixture<FamilyMemberAttachmentListPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), FamilyMemberAttachmentListPage],
    }).compileComponents();

    fixture = TestBed.createComponent(FamilyMemberAttachmentListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});