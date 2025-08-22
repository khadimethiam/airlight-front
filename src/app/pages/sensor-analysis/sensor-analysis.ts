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

    this.sensorService.getLatestSensorData(this.selectedSensorId).subscribe(response => {
      if (response.success) this.latestData = response.data;
    });

    this.sensorService.getSensorData(this.selectedSensorId, '24h').subscribe(response => {
      if (response.success) {
        this.historicalData = response.data;
        this.totalPages = Math.ceil(this.historicalData.length / this.itemsPerPage);
        this.updatePaginatedData();
        // On utilise un setTimeout pour s'assurer que le canvas est bien dans le DOM
        setTimeout(() => this.initHistoryChart(), 0);
      }
      this.isLoadingData = false;
    });
  }

  private initHistoryChart(): void {
    if (!this.historyChartCanvas || this.historicalData.length === 0) return;

    const ctx = this.historyChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Préparation des données pour le graphique (on inverse les données pour un ordre chronologique)
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

  // --- MÉTHODES DE PAGINATION ---
  updatePaginatedData(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedData = this.historicalData.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }
  // --- FIN DES MÉTHODES DE PAGINATION ---

  getPmStatus(value: number): string {
    if (value < 15) return 'Bon';
    if (value < 35) return 'Modéré';
    if (value < 55) return 'Mauvais';
    return 'Dangereux';
  }

  ngOnDestroy(): void {
    if (this.historyChart) this.historyChart.destroy();
  }
}
