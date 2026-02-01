import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.isAdmin$.pipe(
      tap(isAdmin => {
        if (!isAdmin) {
          // Rediriger vers la page des capteurs (accessible à tous)
          this.router.navigate(['/dashboard/sensors']);
        }
      })
    );
  }
}