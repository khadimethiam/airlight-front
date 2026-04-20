import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.css']
})
export class Auth implements OnInit {
  isLoginView = true;
  loginForm: FormGroup;
  registerForm: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;

  // ✅ Variables pour gérer la visibilité des mots de passe
  showLoginPassword = false;
  showRegisterPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
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

  ngOnInit(): void {
    // ✅ Lire le query param ?mode= pour ouvrir le bon onglet depuis le header
    const mode = this.route.snapshot.queryParamMap.get('mode');
    if (mode === 'register') {
      this.isLoginView = false;
    }
  }

  switchTo(view: 'login' | 'register'): void {
    this.isLoginView = view === 'login';
    this.clearMessages();
    // ✅ Réinitialiser la visibilité des mots de passe lors du changement d'onglet
    this.showLoginPassword = false;
    this.showRegisterPassword = false;
    this.showConfirmPassword = false;
  }

  // ✅ NOUVELLES MÉTHODES: Toggle password visibility
  toggleLoginPassword(): void {
    this.showLoginPassword = !this.showLoginPassword;
  }

  toggleRegisterPassword(): void {
    this.showRegisterPassword = !this.showRegisterPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
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
          this.successMessage = "Connexion réussie ! Redirection...";
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1000);
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
          this.successMessage = "Inscription réussie ! Redirection...";
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1000);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Une erreur est survenue lors de l\'inscription.';
      }
    });
  }

  // ✅ APRÈS
  onGoogleAuth(): void {
      window.location.href = `${environment.apiUrl}/auth/google`;
  }

  private clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }
}