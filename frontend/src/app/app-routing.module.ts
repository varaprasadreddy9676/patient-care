import { Routes } from '@angular/router';
import { AuthGuardService } from '../services/user-authentication/auth-guard.service';

export const routes: Routes = [
  { path: '', redirectTo: 'sign-in', pathMatch: 'full' },

  {
    path: 'sign-in',
    loadComponent: () =>
      import('../pages/login/sign-in/sign-in.page').then((m) => m.SignInPage),
  },
  {
    path: 'sign-in/:hospitalCode',
    loadComponent: () =>
      import('../pages/login/sign-in/sign-in.page').then((m) => m.SignInPage),
    canActivate: [AuthGuardService],
  },
  {
    path: 'home',
    loadComponent: () =>
      import('../pages/home/home-template/home-template.page').then(
        (m) => m.HomeTemplatePage
      ),
    canActivate: [AuthGuardService],
    loadChildren: () =>
      import('../pages/home/home-template/home-template-routing.module').then(
        (m) => m.homeTemplateRoutes
      ),
  },
  {
    path: 'sign-up',
    loadComponent: () =>
      import('../pages/login/sign-up/sign-up.page').then((m) => m.SignUpPage),
    canActivate: [AuthGuardService],
  },
  {
    path: 'token-verification',
    loadComponent: () =>
      import('../pages/login/token-verification/token-verification.page').then(
        (m) => m.TokenVerificationPage
      ),
    canActivate: [AuthGuardService],
  },
  {
    path: 'chat/:sessionId',
    loadComponent: () =>
      import('../pages/chat/chat.page').then((m) => m.ChatPage),
    canActivate: [AuthGuardService],
  },
  {
    path: 'patient-assessment',
    loadComponent: () =>
      import('../pages/patient-assessment/patient-assessment.page').then(
        (m) => m.PatientAssessmentPage
      ),
    canActivate: [AuthGuardService],
  },
  { path: '**', redirectTo: 'sign-in' },

];
