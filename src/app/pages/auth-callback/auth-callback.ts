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

  constructor(
    private route: ActivatedRoute, // Pour lire les paramètres de l'URL
    private router: Router,         // Pour rediriger l'utilisateur
    private auth: AuthService // Pour gérer l'authentification
  ) {}

  ngOnInit(): void {
    // On écoute les paramètres de la requête dans l'URL
    this.route.queryParamMap.subscribe(params => {
      const token = params.get('token');
      const userParam = params.get('user');

      if (token && userParam) {
        try {
          // Le paramètre 'user' est une chaîne JSON, il faut le parser
          const user = JSON.parse(userParam);
          
          // On utilise notre service pour stocker les informations
          this.auth.handleGoogleAuthentication(user, token);
          
          // On redirige l'utilisateur vers le dashboard
          this.router.navigate(['/dashboard']);

        } catch (error) {
          console.error("Erreur lors du traitement des données de callback Google", error);
          // En cas d'erreur, on redirige vers la page de connexion avec un message d'erreur
          this.router.navigate(['/auth'], { queryParams: { error: 'invalid_data' } });
        }
      } else {
        // Si le token ou l'utilisateur est manquant, c'est une erreur
        console.error("Token ou utilisateur manquant dans le callback Google.");
        this.router.navigate(['/auth'], { queryParams: { error: 'missing_data' } });
      }
    });
  }
}
