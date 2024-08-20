import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { lastValueFrom, Observable, ReplaySubject } from 'rxjs';
import { AccessUser, UserDTO } from '../../utils/interfaces/global.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly _http = inject(HttpClient);
  private _loading$ = new ReplaySubject<boolean>();

  get loading$(): Observable<boolean> {
    return this._loading$.asObservable();
  }

  get isAuthenticated() {
    return sessionStorage.getItem('authToken');
  }

  public login(form: Partial<UserDTO>) {
    return this._authentication(form)
      .then(res => {
        sessionStorage.setItem('authToken', res.accessToken);
        if (res.username) sessionStorage.setItem('username', res.username);
        if (res.type) sessionStorage.setItem('type', res.type);
      })
      .catch(err => {
        console.error(err.message);
      })
  }

  private _authentication(user: Partial<UserDTO>): Promise<AccessUser> {
    this._loading$.next(true);

    return lastValueFrom(
      this._http.post<AccessUser>(`/api/v1/login`, user)
    ).finally(() => this._loading$.next(false));
  }

  // get isAdmin() {
  //   return this._db.userActivated()?.type === 'admin';
  // }

  // public isAuthenticated(): boolean {
  //   // Implement your authentication check logic here
  //   // For example, check if a token exists in localStorage
  //   return !!localStorage.getItem('authToken');
  // }

  // public login(form: Partial<UserDTO>) {
  //   this._authenticated
  //   // if (this._authenticated(form) != null) {
  //   //   localStorage.setItem('authToken', 'your-token');
  //   //   this._db.userActivated.set(this._authenticated(form)!);
  //   //   return true;
  //   // }
  //   // return false;
  // }

  // private _authenticated(form: Partial<UserDTO>) {
  //   return this._db.userTable().find((db: UserDTO) => db.email == form.email && db.password == form.password);
  // }

  public logout() {
    sessionStorage.clear()
  }

  // Other authentication methods like login, logout, etc.
}
