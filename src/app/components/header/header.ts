import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header {
  // Cette méthode permet de faire défiler la vue vers une section spécifique de la page.
  // L'événement est nécessaire pour empêcher le comportement par défaut du lien.
  scrollToSection(event: Event, sectionId: string): void {
    event.preventDefault(); // Empêche le rechargement de la page
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
