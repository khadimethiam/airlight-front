import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth';

export const authInterceptor: HttpInterceptorFn = (req, next ) => {
  const authService = inject(AuthService);
  const authToken = authService.getToken();

  // Si un token existe, on clone la requête pour y ajouter le header d'autorisation
  if (authToken) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`
      }
    });
    return next(authReq);
  }

  // Sinon, on laisse la requête originale passer (pour les routes publiques)
  return next(req);
};
