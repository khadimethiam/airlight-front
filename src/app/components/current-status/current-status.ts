import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs'; // Pour lancer plusieurs appels en parallèle
import { WeatherService } from '../../services/weather';
import { SensorService, SensorData } from '../../services/sensor';

@Component({
  selector: 'app-current-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './current-status.html',
  styleUrls: ['./current-status.css']
})
export class CurrentStatus implements OnInit {

  public isLoading = true;
  public weatherData: any = null;
  public latestSensorData: SensorData | null = null;
  public aqiStatus = { level: 'Chargement...', class: 'text-muted' };

  constructor(
    private weatherService: WeatherService,
    private sensorService: SensorService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    
    // On lance les deux appels API en parallèle
    forkJoin({
      weather: this.weatherService.getCurrentWeather('Dakar'), // Météo pour Dakar
      sensor: this.sensorService.getLatestSensorData('d83bda1bbc9c') // Données du capteur principal
    }).subscribe({
      next: ({ weather, sensor }) => {
        if (weather.success) {
          this.weatherData = weather.data;
        }
        if (sensor.success) {
          this.latestSensorData = sensor.data;
          this.updateAqiStatus(sensor.data.airQualityIndex);
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        // Gérer l'erreur si nécessaire
      }
    });
  }
 getAqiCursorPosition(): string {
    if (!this.latestSensorData) {
      return '0%';
    }
    
    const aqi = this.latestSensorData.airQualityIndex;
    // L'échelle va de 0 à 200 (ou plus, mais on la limite pour la lisibilité)
    const maxAqiForScale = 200; 
    
    // Calcule le pourcentage et s'assure qu'il ne dépasse pas 100%
    const percentage = Math.min((aqi / maxAqiForScale) * 100, 100);
    
    return `${percentage}%`;
  }
  updateAqiStatus(aqi: number): void {
    if (aqi <= 50) {
      this.aqiStatus = { level: 'Bon', class: 'status-good' };
    } else if (aqi <= 100) {
      this.aqiStatus = { level: 'Modéré', class: 'status-moderate' };
    } else if (aqi <= 150) {
      this.aqiStatus = { level: 'Mauvais', class: 'status-unhealthy' };
    } else {
      this.aqiStatus = { level: 'Dangereux', class: 'status-hazardous' };
    }
  }
}
