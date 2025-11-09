import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { NewServiceRequestPage } from './new-service-request.page';

describe('NewServiceRequestPage', () => {
  let component: NewServiceRequestPage;
  let fixture: ComponentFixture<NewServiceRequestPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), NewServiceRequestPage],
    }).compileComponents();

    fixture = TestBed.createComponent(NewServiceRequestPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});