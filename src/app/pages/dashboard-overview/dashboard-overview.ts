// src/app/pages/dashboard-overview/dashboard-overview.ts

// --- IMPORTS CORRIGÉS ---
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardData } from '../../services/dashboard';
import { SensorService, Sensor } from '../../services/sensor';

// Imports pour Chart.js et Leaflet
import { Chart, registerables } from 'chart.js';
import * as L from 'leaflet';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-overview.html',
  styleUrls: ['./dashboard-overview.css']
})
// --- NOM DE CLASSE CORRIGÉ ---
export class DashboardOverview implements OnInit, AfterViewInit, OnDestroy {
  
  // --- DÉCLARATIONS DE PROPRIÉTÉS CORRIGÉES ---
  @ViewChild('trendChart') private trendChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('map') private mapContainer!: ElementRef<HTMLDivElement>;
  private isViewInitialized = false;

  public dashboardData?: DashboardData['data'];
  public sensors: Sensor[] = [];
  public isLoading = true;
  public errorMessage: string | null = null;

  private trendChart?: Chart;
  private map?: L.Map;

  constructor(
    private dashboardService: DashboardService,
    private sensorService: SensorService
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    this.isViewInitialized = true; // La vue est maintenant prête
    // Si les données sont déjà arrivées avant que la vue ne soit prête, on initialise les graphiques
    if (this.dashboardData) {
      this.initVisualizations();
    }
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.dashboardService.getOverviewData().subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboardData = response.data;
        } else {
          this.errorMessage = "Les données du tableau de bord n'ont pas pu être chargées.";
        }
      },
      error: (err) => {
        this.handleError(err);
      },
      complete: () => {
        this.loadChartAndMapData();
      }
    });
  }

 initVisualizations(): void {
    this.dashboardService.getGlobalSensorStats('24h').subscribe(statsResponse => {
      if (statsResponse.success) {
        this.initTrendChart(statsResponse.data.timeEvolution);
      }
    });
    this.initMap();
  }

  loadChartAndMapData(): void {
    this.dashboardService.getGlobalSensorStats('24h').subscribe(statsResponse => {
      if (statsResponse.success) {
        this.initTrendChart(statsResponse.data.timeEvolution);
      }
    });

    this.sensorService.getSensors().subscribe(sensorsResponse => {
      if (sensorsResponse.success) {
        this.sensors = sensorsResponse.data;
        // On attend que la vue soit prête pour initialiser la carte
        setTimeout(() => this.initMap(), 0);
      }
      this.isLoading = false;
    });
  }

  private initTrendChart(timeEvolution: any[]): void {
    if (!this.trendChartCanvas || !timeEvolution || timeEvolution.length === 0) return;
    const ctx = this.trendChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = timeEvolution.map(d => new Date(d.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit' }) + 'h');
    const data = timeEvolution.map(d => d.avgAQI);

    if (this.trendChart) this.trendChart.destroy();

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'AQI Moyen',
          data: data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  private initMap(): void {
    if (!this.mapContainer || this.sensors.length === 0 || this.map) return;

    const defaultCoords: L.LatLngTuple = [14.7167, -17.4677];
    this.map = L.map(this.mapContainer.nativeElement).setView(defaultCoords, 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    } ).addTo(this.map);

    this.sensors.forEach(sensor => {
      if (sensor.coordinates?.lat && sensor.coordinates?.lng) {
        const coords: L.LatLngTuple = [sensor.coordinates.lat, sensor.coordinates.lng];
        const aqi = Math.round(sensor.airQualityIndex || 0);
        let color = 'green';
        if (aqi > 100) color = 'red';
        else if (aqi > 50) color = 'orange';

        const icon = L.divIcon({
          className: `custom-map-icon icon-${color}`,
          html: `<span>${aqi}</span>`,
          iconSize: [30, 30]
        });

        L.marker(coords, { icon: icon })
          .addTo(this.map!)
          .bindPopup(`<b>${sensor.name}</b>  
AQI: ${aqi}`);
      }
    });
  }

  private handleError(err: any): void {
    this.errorMessage = err.error?.message || 'Une erreur de communication est survenue.';
    this.isLoading = false;
  }

  ngOnDestroy(): void {
    if (this.trendChart) this.trendChart.destroy();
    if (this.map) this.map.remove();
  }
}
