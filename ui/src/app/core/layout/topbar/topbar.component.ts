import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { UserDTO } from '../../../utils/interfaces/global.interface';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, MatMenuModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  private _authService = inject(AuthService);
  private _router = inject(Router);

  get today() {
    return new Date();
  }

  get user(): Partial<UserDTO> {
    return {
      username: sessionStorage.getItem('username') ?? 'User',
      type: sessionStorage.getItem('type'),
    };
  }
  get isAdmin() {
    return this.user.type === 'ADMIN';
  }

  public logout() {
    this._authService.logout();

    if (!this._authService.isAuthenticated) this._router.navigate(['/login']);
  }
}
