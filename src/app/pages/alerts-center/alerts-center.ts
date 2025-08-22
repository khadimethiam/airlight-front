import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService, Alert } from '../../services/alert';
import { SensorService, Sensor } from '../../services/sensor';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-alerts-center',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alerts-center.html',
  styleUrls: ['./alerts-center.css']
})
export class AlertsCenter implements OnInit, OnDestroy {

  @ViewChild('severityChart') private severityChartCanvas!: ElementRef<HTMLCanvasElement>;
  private severityChart?: Chart;

  public alerts: Alert[] = [];
  public sensors: Sensor[] = [];
  public isLoading = true;

  // Modèle pour les filtres
  public filters = {
    severity: '',
    sensorId: '',
    isActive: 'true' // Par défaut, on affiche les alertes actives
  };

  constructor(
    private alertService: AlertService,
    private sensorService: SensorService
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading = true;
    // Charge la liste des capteurs pour le filtre
    this.sensorService.getSensors().subscribe(response => {
      if (response.success) {
        this.sensors = response.data;
      }
    });
    // Charge les alertes et les statistiques
    this.applyFilters();
    this.loadStats();
  }

  applyFilters(): void {
    this.isLoading = true;
    this.alertService.getAlerts(this.filters).subscribe(response => {
      if (response.success) {
        this.alerts = response.data;
      }
      this.isLoading = false;
    });
  }

  loadStats(): void {
    this.alertService.getAlertStats('7d').subscribe(response => {
      if (response.success) {
        this.initSeverityChart(response.data.summary);
      }
    });
  }

  initSeverityChart(stats: any): void {
    if (!this.severityChartCanvas || !stats) return;

    const ctx = this.severityChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = {
      labels: ['Dangereux', 'Malsain', 'Mauvais', 'Modéré'],
      datasets: [{
        label: 'Alertes (7 derniers jours)',
        data: [
          stats.hazardous || 0,
          stats.unhealthy || 0,
          stats.poor || 0,
          stats.moderate || 0
        ],
        backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#0dcaf0']
      }]
    };

    if (this.severityChart) this.severityChart.destroy();

    this.severityChart = new Chart(ctx, {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        }
      }
    });
  }

  acknowledge(alertId: string): void {
    this.alertService.acknowledgeAlert(alertId).subscribe(() => {
      this.applyFilters(); // Recharge les données après l'action
    });
  }

  // Helper pour les classes CSS
  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'hazardous': return 'bg-danger text-white';
      case 'unhealthy': return 'bg-danger-subtle text-danger-emphasis';
      case 'poor': return 'bg-warning-subtle text-warning-emphasis';
      case 'moderate': return 'bg-info-subtle text-info-emphasis';
      default: return 'bg-secondary-subtle';
    }
  }

  ngOnDestroy(): void {
    if (this.severityChart) this.severityChart.destroy();
  }
}
