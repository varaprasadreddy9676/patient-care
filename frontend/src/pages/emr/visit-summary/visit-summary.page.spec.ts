import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisitSummaryPage } from './visit-summary.page';

describe('VisitSummaryPage', () => {
  let component: VisitSummaryPage;
  let fixture: ComponentFixture<VisitSummaryPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitSummaryPage],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitSummaryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
