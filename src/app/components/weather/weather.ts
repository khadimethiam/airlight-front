import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Interface pour typer nos données météo
interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  uvIndex: number;
  iconClass: string;
}

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather.html',
  styleUrls: ['./weather.css']
})
export class Weather implements OnInit {
  
  // Variable pour stocker les données météo.
  // L'utilisation de '?' ou 'undefined' indique que la variable peut ne pas être initialisée immédiatement.
  weatherData?: WeatherData;
  isLoading = true;
  hasError = false;

  ngOnInit(): void {
    // ngOnInit est un "hook" d'Angular qui s'exécute à l'initialisation du composant.
    // Nous simulons ici un appel à une API qui prend un peu de temps.
    this.loadWeatherData();
  }

  loadWeatherData(): void {
    this.isLoading = true;
    this.hasError = false;

    // Simule une attente de 500ms avant d'afficher les données
    setTimeout(() => {
      try {
        // En situation réelle, vous feriez un appel HTTP ici.
        // Pour la démo, nous utilisons des données fixes.
        this.weatherData = {
          location: "Paris, France",
          temperature: 22,
          description: "Nuageux",
          humidity: 65,
          windSpeed: 12,
          pressure: 1013,
          uvIndex: 6,
          iconClass: "fas fa-cloud" // Icône Font Awesome pour "Nuageux"
        };
        this.isLoading = false;
      } catch (error) {
        this.hasError = true;
        this.isLoading = false;
        console.error('Erreur lors du chargement des données météo:', error);
      }
    }, 500);
  }
}
