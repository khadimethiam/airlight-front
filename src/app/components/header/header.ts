import { Component, OnInit } from '@angular/core'; // <-- Ajoutez OnInit
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth'; // <-- Importez AuthService
import { Observable } from 'rxjs'; // <-- Importez Observable

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header implements OnInit { // <-- Implémentez OnInit
  
  // Déclarez un observable pour les informations de l'utilisateur
  public user$: Observable<any | null>;

  // Injectez le service
  constructor(private authService: AuthService) {
    // Initialisez l'observable en le liant à celui du service
    this.user$ = this.authService.user$;
  }

  ngOnInit(): void {
    // Le constructeur s'en occupe déjà, mais c'est une bonne pratique
  }

  scrollToSection(event: Event, sectionId: string): void {
    event.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
