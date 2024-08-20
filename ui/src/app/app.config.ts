import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';

import { registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNgxMask } from 'ngx-mask';
import { routes } from './app.routes';
import { EXCLUDED_URLS } from './core/auth/auth.config';
import { MyHttpInterceptor } from './core/auth/http.interceptor';

import localePtExtra from '@angular/common/locales/extra/pt';
import localePt from '@angular/common/locales/pt';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideEnvironmentNgxCurrency } from 'ngx-currency';
import { CONFIG_CURRENCY } from './utils/interfaces/global.interface';
import { MatPaginatorIntlPortuguese } from './utils/providers/mat-paginator-intl-portuguese.provider';

registerLocaleData(localePt, 'pt-BR', localePtExtra);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MyHttpInterceptor,
      multi: true
    },
    { provide: EXCLUDED_URLS, useValue: ['/login', '/register'] },
    provideNativeDateAdapter(),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: MatPaginatorIntl, useClass: MatPaginatorIntlPortuguese },
    provideNgxMask(),
    provideEnvironmentNgxCurrency(CONFIG_CURRENCY),
  ]
};
