// src/app/pages/sensor-analysis/sensor-analysis.ts

import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SensorService, Sensor, SensorData } from '../../services/sensor';
import { GaugeComponent } from '../../components/gauge/gauge';

// Import pour Chart.js
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-sensor-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, GaugeComponent],
  templateUrl: './sensor-analysis.html',
  styleUrls: ['./sensor-analysis.css']
})
export class SensorAnalysis implements OnInit, OnDestroy {

  // Référence au canvas du graphique
  @ViewChild('historyChart') private historyChartCanvas!: ElementRef<HTMLCanvasElement>;
  private historyChart?: Chart;

  public sensors: Sensor[] = [];
  public selectedSensorId: string | null = null;
  public latestData: SensorData | null = null;
  public historicalData: SensorData[] = [];

  public isLoadingSensors = true;
  public isLoadingData = false;

  // Propriétés pour la pagination
  public currentPage = 1;
  public itemsPerPage = 10;
  public totalPages = 0;
  public paginatedData: SensorData[] = [];

  constructor(private sensorService: SensorService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadSensors();
  }

  loadSensors(): void {
    this.isLoadingSensors = true;
    this.sensorService.getSensors().subscribe(response => {
      if (response.success) {
        this.sensors = response.data;
        if (this.sensors.length > 0) {
          this.selectedSensorId = this.sensors[0].id;
          this.onSensorChange();
        }
      }
      this.isLoadingSensors = false;
    });
  }

  onSensorChange(): void {
    if (!this.selectedSensorId) return;

    this.isLoadingData = true;
    this.latestData = null;
    this.historicalData = [];
    this.currentPage = 1; // Reset pagination

    this.sensorService.getLatestSensorData(this.selectedSensorId).subscribe(response => {
      if (response.success) this.latestData = response.data;
    });

    this.sensorService.getSensorData(this.selectedSensorId, '24h').subscribe(response => {
      if (response.success) {
        this.historicalData = response.data;
        this.totalPages = Math.ceil(this.historicalData.length / this.itemsPerPage);
        this.updatePaginatedData();
        setTimeout(() => this.initHistoryChart(), 0);
      }
      this.isLoadingData = false;
    });
  }

  private initHistoryChart(): void {
    if (!this.historyChartCanvas || this.historicalData.length === 0) return;

    const ctx = this.historyChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const reversedData = [...this.historicalData].reverse();
    const labels = reversedData.map(d => new Date(d.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    const pm25Data = reversedData.map(d => d.measurements.pm25);
    const pm10Data = reversedData.map(d => d.measurements.pm10);

    if (this.historyChart) this.historyChart.destroy();

    this.historyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'PM2.5',
            data: pm25Data,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 2
          },
          {
            label: 'PM10',
            data: pm10Data,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 2
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // ============================================
  // ✅ NOUVEAUX HELPERS POUR INFO CAPTEUR
  // ============================================

  getSelectedSensor(): Sensor | undefined {
    return this.sensors.find(s => s.id === this.selectedSensorId);
  }

  getSelectedSensorName(): string {
    return this.getSelectedSensor()?.name || 'Capteur';
  }

  getSelectedSensorCity(): string {
    return this.getSelectedSensor()?.city || 'Ville inconnue';
  }

  getSelectedSensorCountry(): string {
    return this.getSelectedSensor()?.country || 'Sénégal';
  }

  getSensorStatusText(): string {
    const sensor = this.getSelectedSensor();
    if (!sensor) return 'Inconnu';

    // Vérifier plusieurs propriétés possibles
    if (sensor.status === 'online' || sensor.isOnline === true) {
      return 'En ligne';
    } else if (sensor.status === 'offline' || sensor.isOnline === false) {
      return 'Hors ligne';
    }

    return 'Statut inconnu';
  }

  getSensorStatusClass(): string {
    const sensor = this.getSelectedSensor();
    if (!sensor) return 'status-unknown';

    if (sensor.status === 'online' || sensor.isOnline === true) {
      return 'status-online';
    } else if (sensor.status === 'offline' || sensor.isOnline === false) {
      return 'status-offline';
    }

    return 'status-unknown';
  }

  // ============================================
  // ✅ HELPERS POUR LES STATUTS (GAUGES)
  // ============================================

  getAQIStatus(aqi: number): string {
    if (aqi <= 50) return 'Bon';
    if (aqi <= 100) return 'Modéré';
    if (aqi <= 150) return 'Mauvais';
    if (aqi <= 200) return 'Malsain';
    if (aqi <= 300) return 'Très mauvais';
    return 'Dangereux';
  }

  getPmStatus(value: number): string {
    if (value < 15) return 'Bon';
    if (value < 35) return 'Modéré';
    if (value < 55) return 'Mauvais';
    return 'Dangereux';
  }

  getCO2Status(value: number): string {
    if (value < 1000) return 'Bon';
    if (value < 1500) return 'Modéré';
    if (value < 2000) return 'Élevé';
    return 'Dangereux';
  }

  getTemperatureStatus(value: number): string {
    if (value >= 18 && value <= 26) return 'Optimal';
    if (value >= 15 && value <= 30) return 'Acceptable';
    return 'Inconfortable';
  }

  getHumidityStatus(value: number): string {
    if (value >= 40 && value <= 60) return 'Optimal';
    if (value >= 30 && value <= 70) return 'Acceptable';
    if (value < 30) return 'Sec';
    return 'Humide';
  }

  getTVOCStatus(value: number): string {
    if (value < 220) return 'Bon';
    if (value < 660) return 'Modéré';
    if (value < 2200) return 'Mauvais';
    return 'Dangereux';
  }

  // ============================================
  // ✅ HELPERS POUR LES BADGES DU TABLEAU
  // ============================================

  getAQIBadgeClass(aqi: number): string {
    if (aqi <= 50) return 'bg-success';
    if (aqi <= 100) return 'bg-info';
    if (aqi <= 150) return 'bg-warning';
    if (aqi <= 200) return 'bg-danger';
    return 'bg-dark';
  }

  // ============================================
  // ✅ PAGINATION - Style Centre d'Alertes
  // ============================================

  updatePaginatedData(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedData = this.historicalData.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
      this.scrollToTop();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedData();
      this.scrollToTop();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedData();
      this.scrollToTop();
    }
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage;
  }

  getEndIndex(): number {
    const end = this.currentPage * this.itemsPerPage;
    return end > this.historicalData.length ? this.historicalData.length : end;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ============================================
  // CLEANUP
  // ============================================

  ngOnDestroy(): void {
    if (this.historyChart) this.historyChart.destroy();
  }
}
