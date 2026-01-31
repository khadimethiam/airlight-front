import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { Router } from '@angular/router';

// Interface pour la réponse de l'API de connexion/inscription
export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatar?: string;
  };
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';

  // ✅ BehaviorSubject pour l'utilisateur
  private userSubject = new BehaviorSubject<any | null>(null);
  public user$ = this.userSubject.asObservable();

  // ✅ Observable pour vérifier si l'utilisateur est admin
  public isAdmin$: Observable<boolean>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // ✅ isAdmin$ dérive de user$
    this.isAdmin$ = this.user$.pipe(
      map(user => !!user && user.role === 'admin'),
      tap(isAdmin => console.log('🔐 isAdmin$ mis à jour:', isAdmin))
    );

    // Charger l'utilisateur depuis localStorage au démarrage
    this.loadInitialUser();
  }

  // ✅ Inscription
  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          console.log('✅ Inscription réussie:', response.user);
          this.setAuthState(response.token, response.user);
        }
      })
    );
  }

  // ✅ Connexion
  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          console.log('✅ Connexion réussie:', response.user);
          this.setAuthState(response.token, response.user);
        }
      })
    );
  }

  // ✅ MÉTHODE PRINCIPALE : Définir l'état d'authentification
  // Utilisée par login, register, et OAuth callback
  setAuthState(token: string, user: any): void {
    console.log('🔐 setAuthState appelée');
    console.log('   Token:', token.substring(0, 20) + '...');
    console.log('   User:', user);
    console.log('   Role:', user.role);

    // Stocker dans localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));

    // Mettre à jour le BehaviorSubject (déclenche user$ et isAdmin$)
    this.userSubject.next(user);

    console.log('✅ État d\'authentification mis à jour');
  }

  // ✅ ALIAS pour compatibilité (si tu l'utilises ailleurs)
  handleGoogleAuthentication(user: any, token: string): void {
    console.log('⚠️ handleGoogleAuthentication appelée (utilise setAuthState à la place)');
    this.setAuthState(token, user);
  }

  // ✅ Déconnexion
  logout(): void {
    console.log('🚪 Déconnexion');

    // Nettoyer localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');

    // Réinitialiser l'état
    this.userSubject.next(null);

    // Rediriger vers la page de connexion
    this.router.navigate(['/auth']);

    console.log('✅ Déconnexion effectuée');
  }

  // ✅ Charger l'utilisateur depuis localStorage au démarrage
  private loadInitialUser(): void {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('authUser');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('👤 Utilisateur chargé depuis localStorage:', user);
        console.log('   Role:', user.role);
        this.userSubject.next(user);
      } catch (error) {
        console.error('❌ Erreur parsing authUser:', error);
        // Si erreur, nettoyer
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    } else {
      console.log('ℹ️ Aucun utilisateur en localStorage');
    }
  }

  // ✅ Récupérer le token actuel
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // ✅ Vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // ✅ Récupérer l'utilisateur actuel (synchrone)
  getCurrentUser(): any | null {
    return this.userSubject.value;
  }

  // ✅ Vérifier si l'utilisateur est admin (synchrone)
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  // ✅ Vérifier si l'utilisateur est user (synchrone)
  isUser(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'user';
  }

  // ✅ Debug : Afficher l'état actuel
  debugState(): void {
    const user = this.getCurrentUser();
    const isAuth = this.isLoggedIn();
    const isAdmin = this.isAdmin();

    console.log('📊 État actuel du AuthService:');
    console.log('   Authentifié:', isAuth);
    console.log('   User:', user);
    console.log('   Role:', user?.role);
    console.log('   Is Admin:', isAdmin);
  }
}