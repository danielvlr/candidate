import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { EXCLUDED_URLS } from './auth.config';

@Injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  constructor(@Inject(EXCLUDED_URLS) private _excludedUrls: string[]) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const shouldSkip = this._excludedUrls.some(url => req.url.includes(url));

    if (shouldSkip) {
      return next.handle(req);
    }

    const accessToken = sessionStorage.getItem('authToken')
    const clonedRequest = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
      // headers: new HttpHeaders({
      //   'content-type': 'application/json',
      //   'accept': '*',
      //   'authorization': `Bearer ${accessToken}`
      // })
    });

    console.log('Request is on its way');

    return next.handle(clonedRequest).pipe(
      finalize(() => {
        console.log('Request completed');
      })
    );
  }
}
