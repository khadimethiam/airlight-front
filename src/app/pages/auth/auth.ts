import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; // Importez Router
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth'; // Importez le service

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.css']
})
export class Auth {
  isLoginView = true;
  loginForm: FormGroup;
  registerForm: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false; // Pour afficher un indicateur de chargement

  // Injectez AuthService et Router
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  switchTo(view: 'login' | 'register'): void {
    this.isLoginView = view === 'login';
    this.clearMessages();
  }

  onLogin(): void {
    this.clearMessages();
    if (this.loginForm.invalid) {
      this.errorMessage = "Veuillez remplir correctement tous les champs.";
      return;
    }
    this.isLoading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.router.navigate(['/dashboard']); // Redirection vers le dashboard
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Une erreur est survenue lors de la connexion.';
      }
    });
  }

  onRegister(): void {
    this.clearMessages();
    if (this.registerForm.invalid) {
      this.errorMessage = "Veuillez remplir correctement tous les champs.";
      return;
    }
    if (this.registerForm.value.password !== this.registerForm.value.confirmPassword) {
      this.errorMessage = "Les mots de passe ne correspondent pas.";
      return;
    }
    this.isLoading = true;
    // On ne veut pas envoyer confirmPassword au backend
    const { confirmPassword, ...registrationData } = this.registerForm.value;
    this.authService.register(registrationData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.router.navigate(['/dashboard']); // Redirection vers le dashboard
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Une erreur est survenue lors de l\'inscription.';
      }
    });
  }

  onGoogleAuth(): void {
    // Redirection directe vers l'URL de l'API pour l'authentification Google
    window.location.href = 'http://localhost:3000/auth/google';
  }

  private clearMessages( ): void {
    this.errorMessage = null;
    this.successMessage = null;
  }
}
