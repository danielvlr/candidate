import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { UserDTO } from '../../../utils/interfaces/global.interface';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  public loginForm = new FormGroup({
    username: new FormControl<string | null>(null, Validators.required),
    password: new FormControl<string | null>(null, Validators.required),
  });
  private _router = inject(Router);
  private _authService = inject(AuthService);

  get loading$() {
    return this._authService.loading$;
  }

  public ngOnInit(): void {
    if (this._authService.isAuthenticated) {
      this._router.navigate(['/dashboard']); // Redirect to the protected route or home page
    }
  }

  public login(form: Partial<UserDTO>) {
    this._authService
      .login(form)
      .then((_) => this._router.navigate(['/dashboard']));
  }

  public register() {
    this._router.navigate(['/register']);
  }
}
