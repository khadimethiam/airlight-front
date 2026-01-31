import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherService, WeatherResponse } from '../../services/weather';

// Interface pour typer nos données météo (format simplifié pour l'affichage)
interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  description: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  iconClass: string;
  iconUrl?: string;
  visibility?: number; // ✅ Remplacer UV par visibilité
}

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather.html',
  styleUrls: ['./weather.css']
})
export class Weather implements OnInit {
  
  weatherData?: WeatherData;
  isLoading = true;
  hasError = false;

  constructor(private weatherService: WeatherService) { }

  ngOnInit(): void {
    this.loadWeatherData();
  }

  loadWeatherData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.weatherService.getCurrentWeather('Dakar').subscribe({
      next: (response: WeatherResponse) => {
        if (response && response.success && response.data) {
          this.weatherData = this.transformWeatherData(response);
          this.isLoading = false;
          console.log('✅ Météo chargée:', this.weatherData);
        } else {
          this.hasError = true;
          this.isLoading = false;
          console.error('❌ Réponse API invalide');
        }
      },
      error: (error) => {
        this.hasError = true;
        this.isLoading = false;
        console.error('❌ Erreur lors du chargement de la météo:', error);
      }
    });
  }

  /**
   * Transforme les données de l'API en format utilisable par le template
   */
  private transformWeatherData(response: WeatherResponse): WeatherData {
    const data = response.data;
    
    return {
      location: `${data.location.name}, ${data.location.country}`,
      temperature: data.current.temperature,
      feelsLike: data.current.feels_like,
      description: this.capitalizeFirstLetter(data.current.weather.description),
      humidity: data.current.humidity,
      windSpeed: data.current.wind.speed_kmh,
      pressure: data.current.pressure,
      visibility: (data.current as any).visibility || 0, // ✅ Visibilité au lieu de UV
      iconClass: this.getWeatherIcon(data.current.weather.main),
      iconUrl: this.weatherService.getWeatherIconUrl(data.current.weather.icon)
    };
  }

  /**
   * Retourne l'icône Font Awesome appropriée selon la météo
   */
  private getWeatherIcon(weatherMain: string): string {
    const icons: { [key: string]: string } = {
      'Clear': 'fas fa-sun',
      'Clouds': 'fas fa-cloud',
      'Rain': 'fas fa-cloud-rain',
      'Drizzle': 'fas fa-cloud-rain',
      'Thunderstorm': 'fas fa-bolt',
      'Snow': 'fas fa-snowflake',
      'Mist': 'fas fa-smog',
      'Fog': 'fas fa-smog',
      'Haze': 'fas fa-smog',
      'Smoke': 'fas fa-smog',
      'Dust': 'fas fa-wind',
      'Sand': 'fas fa-wind'
    };
    
    return icons[weatherMain] || 'fas fa-cloud-sun';
  }

  /**
   * Met la première lettre en majuscule
   */
  private capitalizeFirstLetter(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Rafraîchir les données météo
   */
  refresh(): void {
    this.loadWeatherData();
  }
}