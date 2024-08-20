import { Routes } from '@angular/router';
import { authRedirectGuard } from './core/auth/auth-redirect.guard';
import { authGuard } from './core/auth/auth.guard';
import { MainComponent } from './core/layout/main/main.component';

export const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './features/candidate/containers/candidate-index/candidate-index.component'
          ).then((c) => c.CandidateIndexComponent),
      },
    ],
  },
  {
    path: 'login',
    canActivate: [authRedirectGuard],
    loadComponent: () =>
      import('./core/layout/login/login.component').then(
        (c) => c.LoginComponent
      ),
  },
  {
    path: 'register',
    canActivate: [authRedirectGuard],
    loadComponent: () =>
      import('./core/layout/register/container/register.component').then(
        (c) => c.RegisterComponent
      ),
  },
];
