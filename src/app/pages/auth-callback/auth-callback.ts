import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-callback.html',
  styleUrls: ['./auth-callback.css']
})
export class AuthCallback implements OnInit {
  message = 'Authentification en cours...';
  subMessage = 'Veuillez patienter';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('🔄 AuthCallback - Initialisation');
    
    this.route.queryParams.subscribe(params => {
      console.log('📥 Paramètres reçus:', params);
      
      const token = params['token'];
      const userStr = params['user'];
      const error = params['error'];

      // Gérer les erreurs
      if (error) {
        console.error('❌ Erreur OAuth:', error);
        this.message = 'Erreur d\'authentification';
        this.subMessage = this.getErrorMessage(error);
        
        setTimeout(() => {
          this.router.navigate(['/auth'], { 
            queryParams: { error: 'Échec de l\'authentification' } 
          });
        }, 2000);
        return;
      }

      // Vérifier la présence du token et user
      if (token && userStr) {
        try {
          // ✅ Décoder le user depuis l'URL
          const user = JSON.parse(decodeURIComponent(userStr));
          
          console.log('✅ Callback Google - Token reçu:', token.substring(0, 20) + '...');
          console.log('✅ Callback Google - User:', user);
          console.log('✅ Callback Google - Role:', user.role);
          
          // ✅ IMPORTANT: Utiliser setAuthState
          this.authService.setAuthState(token, user);
          
          // Message de bienvenue
          this.message = `Bienvenue ${user.firstName} !`;
          
          // Afficher le rôle
          if (user.role === 'admin') {
            this.subMessage = 'Vous êtes connecté en tant qu\'Administrateur';
          } else {
            this.subMessage = 'Vous êtes connecté en tant qu\'Utilisateur';
          }
          
          // ✅ Redirection selon le rôle
          setTimeout(() => {
            if (user.role === 'admin') {
              console.log('🔀 Redirection admin → /dashboard/overview');
              this.router.navigate(['/dashboard/overview']);
            } else {
              console.log('🔀 Redirection user → /dashboard/sensors');
              this.router.navigate(['/dashboard/sensors']);
            }
          }, 1500);

        } catch (error) {
          console.error('❌ Erreur parsing user:', error);
          this.message = 'Erreur de traitement';
          this.subMessage = 'Données invalides';
          
          setTimeout(() => {
            this.router.navigate(['/auth']);
          }, 2000);
        }
      } else {
        console.error('❌ Token ou user manquant');
        console.log('   Token présent:', !!token);
        console.log('   User présent:', !!userStr);
        
        this.message = 'Données manquantes';
        this.subMessage = 'Token ou utilisateur non fourni';
        
        setTimeout(() => {
          this.router.navigate(['/auth']);
        }, 2000);
      }
    });
  }

  private getErrorMessage(error: string): string {
    const errorMessages: { [key: string]: string } = {
      'google_auth_failed': 'Échec de l\'authentification Google',
      'no_user': 'Utilisateur non trouvé',
      'server_error': 'Erreur serveur',
      'missing_data': 'Données manquantes',
      'callback_error': 'Erreur du callback'
    };
    return errorMessages[error] || 'Une erreur est survenue';
  }
}