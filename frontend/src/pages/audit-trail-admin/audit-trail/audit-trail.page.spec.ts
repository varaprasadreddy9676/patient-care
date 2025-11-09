import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AuditTrailPage } from './audit-trail.page';

describe('AuditTrailPage', () => {
  let component: AuditTrailPage;
  let fixture: ComponentFixture<AuditTrailPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), AuditTrailPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditTrailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});