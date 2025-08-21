import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
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
  providedIn: 'root' // Le service est disponible dans toute l'application
} ) 
export class AuthService {
  // URL de base de votre API backend
  private apiUrl = 'http://localhost:3000/auth'; // Assurez-vous que le port est correct

  // BehaviorSubject pour suivre l'état de connexion de l'utilisateur en temps réel
  private userSubject = new BehaviorSubject<any | null>(null );
  public user$ = this.userSubject.asObservable(); // Observable public

  constructor(
    private http: HttpClient,
    private router: Router
   ) {
    // Au démarrage du service, on vérifie si un token existe dans le localStorage
    this.loadInitialUser();
  }

  // Méthode pour l'inscription
  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData ).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          this.handleAuthentication(response.user, response.token);
        }
      })
    );
  }

  // Méthode pour la connexion
  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials ).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          this.handleAuthentication(response.user, response.token);
        }
      })
    );
  }

  
  handleGoogleAuthentication(user: any, token: string): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
    this.userSubject.next(user); // Met à jour l'état de l'utilisateur
  }
  // Méthode pour la déconnexion
  logout(): void {
    // On pourrait aussi appeler une route /logout du backend si elle fait quelque chose d'important (ex: blacklist token)
    // this.http.post(`${this.apiUrl}/logout`, {} ).subscribe();

    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    this.userSubject.next(null); // Met à jour l'état de l'utilisateur à "déconnecté"
    this.router.navigate(['/auth']); // Redirige vers la page de connexion
  }

  // Vérifie si un token existe au chargement de l'application
  private loadInitialUser(): void {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('authUser');
    if (token && user) {
      this.userSubject.next(JSON.parse(user));
    }
  }

  // Gère le stockage du token et des informations utilisateur après une connexion/inscription réussie
  private handleAuthentication(user: any, token: string): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
    this.userSubject.next(user); // Met à jour l'état de l'utilisateur
  }

  // Méthode pour récupérer le token actuel
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Méthode pour savoir si l'utilisateur est connecté
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
