import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private rootUserSubject = new BehaviorSubject<boolean>(false);
  private adminUserSubject = new BehaviorSubject<boolean>(false);
  private sysadminUserSubject = new BehaviorSubject<boolean>(false);

  rootUser$ = this.rootUserSubject.asObservable();
  adminUser$ = this.adminUserSubject.asObservable();
  sysadminUser$ = this.sysadminUserSubject.asObservable();

  setRootUser(value: boolean) {
    this.rootUserSubject.next(value);
  }

  setAdminUser(value: boolean) {
    this.adminUserSubject.next(value);
  }

  setSysadminUser(value: boolean) {
    this.sysadminUserSubject.next(value);
  }
}