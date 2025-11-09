import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { EmrPage } from './emr.page';

describe('EmrPage', () => {
  let component: EmrPage;
  let fixture: ComponentFixture<EmrPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), EmrPage],
    }).compileComponents();

    fixture = TestBed.createComponent(EmrPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});