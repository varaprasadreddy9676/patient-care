import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { IonicModule } from '@ionic/angular';

import { ConsentFormPage } from './consent-form.page';

describe('ConsentFormPage', () => {
  let component: ConsentFormPage;
  let fixture: ComponentFixture<ConsentFormPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ConsentFormPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsentFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});