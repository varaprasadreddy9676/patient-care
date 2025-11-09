import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { FamilyMemberFormPage } from './family-member-form.page';

describe('FamilyMemberFormPage', () => {
  let component: FamilyMemberFormPage;
  let fixture: ComponentFixture<FamilyMemberFormPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), FamilyMemberFormPage],
    }).compileComponents();

    fixture = TestBed.createComponent(FamilyMemberFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});