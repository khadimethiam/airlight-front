import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

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
  // ✅ CHANGEMENT : environment.apiUrl au lieu de localhost
  private apiUrl = `${environment.apiUrl}/auth`;

  private userSubject = new BehaviorSubject<any | null>(null);
  public user$ = this.userSubject.asObservable();
  public isAdmin$: Observable<boolean>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.isAdmin$ = this.user$.pipe(
      map(user => !!user && user.role === 'admin')
    );

    this.loadInitialUser();
  }

  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          this.setAuthState(response.token, response.user);
        }
      })
    );
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          this.setAuthState(response.token, response.user);
        }
      })
    );
  }

  setAuthState(token: string, user: any): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
    this.userSubject.next(user);
  }

  handleGoogleAuthentication(user: any, token: string): void {
    this.setAuthState(token, user);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    this.userSubject.next(null);
    this.router.navigate(['/auth']);
  }

  private loadInitialUser(): void {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('authUser');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userSubject.next(user);
      } catch (error) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): any | null {
    return this.userSubject.value;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  isUser(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'user';
  }
}