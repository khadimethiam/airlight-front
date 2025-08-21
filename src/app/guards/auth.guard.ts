import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

// Ceci est notre fonction de garde
export const authGuard: CanActivateFn = (route, state) => {
  
  // On injecte les services dont nous avons besoin
  const authService = inject(AuthService);
  const router = inject(Router);

  // On vérifie si l'utilisateur est connecté en utilisant notre service
  if (authService.isLoggedIn()) {
    return true; // L'utilisateur est connecté, on autorise l'accès à la route
  } else {
    // L'utilisateur n'est pas connecté, on le redirige vers la page de connexion
    console.log('Accès refusé - Utilisateur non connecté. Redirection vers /auth.');
    router.navigate(['/auth']);
    return false; // On bloque l'accès à la route demandée
  }
};
