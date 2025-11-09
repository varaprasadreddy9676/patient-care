import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ServiceRequestsPage } from './service-requests.page';

describe('ServiceRequestsPage', () => {
  let component: ServiceRequestsPage;
  let fixture: ComponentFixture<ServiceRequestsPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ServiceRequestsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceRequestsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});