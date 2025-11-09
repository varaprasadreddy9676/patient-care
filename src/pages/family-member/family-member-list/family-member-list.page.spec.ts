import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { FamilyMemberListPage } from './family-member-list.page';

describe('FamilyMemberListPage', () => {
  let component: FamilyMemberListPage;
  let fixture: ComponentFixture<FamilyMemberListPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), FamilyMemberListPage],
    }).compileComponents();

    fixture = TestBed.createComponent(FamilyMemberListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});