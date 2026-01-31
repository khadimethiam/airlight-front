// src/app/pages/dashboard-overview/dashboard-overview.ts - VERSION CORRIGÉE

import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService, DashboardData } from '../../services/dashboard';
import { SensorService, Sensor } from '../../services/sensor';

// Imports pour Chart.js
import { Chart, registerables } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-overview.html',
  styleUrls: ['./dashboard-overview.css']
})
export class DashboardOverview implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('trendChart') private trendChartCanvas!: ElementRef<HTMLCanvasElement>;
  private isViewInitialized = false;
  private chartDataCache: any[] | null = null; // ✅ NOUVEAU : Cache des données

  public dashboardData?: DashboardData['data'];
  public sensors: Sensor[] = [];
  public worstSensors: any[] = [];
  public isLoading = true;
  public errorMessage: string | null = null;
  public chartPeriod: '6h' | '12h' | '24h' = '24h';
  public isChartLoading = false;

  private trendChart?: Chart;

  constructor(
    private dashboardService: DashboardService,
    private sensorService: SensorService,
    private router: Router
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    console.log('✅ ngAfterViewInit appelé');
    this.isViewInitialized = true;

    // ✅ CORRECTION : Attendre un cycle pour que le canvas soit prêt
    setTimeout(() => {
      if (this.chartDataCache) {
        console.log('📊 Création du graphique avec données cachées');
        this.initTrendChart(this.chartDataCache);
        this.chartDataCache = null;
      }
    }, 100);
  }

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // ✅ Charger dashboard et sensors en parallèle, graphique séparément
    forkJoin({
      dashboard: this.dashboardService.getOverviewData(),
      sensors: this.sensorService.getSensors()
    }).subscribe({
      next: ({ dashboard, sensors }) => {
        console.log('📥 Données dashboard reçues');

        // Dashboard data
        if (dashboard.success) {
          this.dashboardData = dashboard.data;
          this.extractWorstSensors();
        }

        // Sensors data
        if (sensors.success) {
          this.sensors = sensors.data;
          this.updateWorstSensorsFromAPI();
        }

        this.isLoading = false;

        // ✅ Charger le graphique APRÈS que le dashboard soit affiché
        setTimeout(() => {
          this.loadChartData();
        }, 50);
      },
      error: (err) => {
        console.error('❌ Erreur chargement dashboard:', err);
        this.errorMessage = 'Erreur lors du chargement des données';
        this.isLoading = false;
      }
    });
  }

  // ============================================
  // GESTION DU GRAPHIQUE
  // ============================================

  loadChartData(): void {
    console.log('📊 loadChartData appelé - Vue initialisée:', this.isViewInitialized);

    if (!this.isViewInitialized) {
      console.warn('⚠️ Vue pas encore initialisée');
      return;
    }

    this.isChartLoading = true;

    this.dashboardService.getGlobalSensorStats(this.chartPeriod).subscribe({
      next: (statsResponse) => {
        console.log('📈 Données graphique reçues:', statsResponse);

        if (statsResponse.success && statsResponse.data?.timeEvolution) {
          // ✅ Si la vue n'est pas encore prête, mettre en cache
          if (!this.trendChartCanvas) {
            console.log('💾 Canvas pas prêt, mise en cache');
            this.chartDataCache = statsResponse.data.timeEvolution;
          } else {
            this.initTrendChart(statsResponse.data.timeEvolution);
          }
        } else {
          console.warn('⚠️ Pas de données timeEvolution');
        }

        this.isChartLoading = false;
      },
      error: (err) => {
        console.error('❌ Erreur chargement graphique:', err);
        this.isChartLoading = false;
      }
    });
  }

  changeChartPeriod(period: '6h' | '12h' | '24h'): void {
    console.log('🔄 Changement période:', period);
    this.chartPeriod = period;
    this.isChartLoading = true;

    this.dashboardService.getGlobalSensorStats(period).subscribe({
      next: (statsResponse) => {
        if (statsResponse.success && statsResponse.data?.timeEvolution) {
          this.initTrendChart(statsResponse.data.timeEvolution);
        }
        this.isChartLoading = false;
      },
      error: (err) => {
        console.error('❌ Erreur changement période:', err);
        this.isChartLoading = false;
      }
    });
  }

  private initTrendChart(timeEvolution: any[]): void {
    console.log('🎨 initTrendChart appelé avec', timeEvolution?.length, 'points');

    // ✅ Vérifications robustes
    if (!this.trendChartCanvas) {
      console.error('❌ Canvas pas encore disponible');
      this.chartDataCache = timeEvolution; // Mettre en cache pour plus tard
      return;
    }

    if (!timeEvolution || timeEvolution.length === 0) {
      console.warn('⚠️ Pas de données pour le graphique');
      return;
    }

    const ctx = this.trendChartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('❌ Impossible d\'obtenir le contexte 2D');
      return;
    }

    // ✅ Préparation des données
    const labels = timeEvolution.map(d => {
      const date = new Date(d.timestamp);
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    });

    const data = timeEvolution.map(d => d.avgAQI || 0);

    console.log('📊 Données préparées:', { labels: labels.length, data: data.length });

    // ✅ Détruire l'ancien graphique si existant
    if (this.trendChart) {
      console.log('🗑️ Destruction ancien graphique');
      this.trendChart.destroy();
      this.trendChart = undefined;
    }

    // ✅ Créer le nouveau graphique
    try {
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
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 750
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: '#3b82f6',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  const value = context.parsed.y;
                  return 'AQI: ' + Math.round(value ?? 0);
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                callback: function(value) {
                  return Math.round((value as number) ?? 0) + ' AQI';
                }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                maxRotation: 45,
                minRotation: 45
              }
            }
          }
        }
      });

      console.log('✅ Graphique créé avec succès');
    } catch (error) {
      console.error('❌ Erreur création graphique:', error);
    }
  }

  // ============================================
  // AQI HELPERS
  // ============================================

  getAQIClass(aqi: number): string {
    if (aqi <= 50) return 'status-good';
    if (aqi <= 100) return 'status-moderate';
    if (aqi <= 150) return 'status-poor';
    if (aqi <= 200) return 'status-unhealthy';
    return 'status-critical';
  }

  getAQILabel(aqi: number): string {
    if (aqi <= 50) return 'Bon';
    if (aqi <= 100) return 'Modéré';
    if (aqi <= 150) return 'Mauvais pour groupes sensibles';
    if (aqi <= 200) return 'Mauvais';
    if (aqi <= 300) return 'Très mauvais';
    return 'Dangereux';
  }

  // ============================================
  // WORST SENSORS EXTRACTION
  // ============================================

  extractWorstSensors(): void {
    if (!this.dashboardData?.sensors || !Array.isArray(this.dashboardData.sensors)) return;

    this.worstSensors = this.dashboardData.sensors
      .filter((sensor: any) => sensor.currentAQI && sensor.currentAQI > 0)
      .map((sensor: any) => ({
        sensorId: sensor.sensorId || sensor.id,
        name: sensor.locationName || sensor.name || sensor.sensorId,
        location: sensor.city || 'Dakar',
        currentAQI: sensor.currentAQI || 0
      }))
      .sort((a, b) => b.currentAQI - a.currentAQI)
      .slice(0, 5);
  }

  updateWorstSensorsFromAPI(): void {
    if (!this.sensors || this.sensors.length === 0) return;

    this.worstSensors = this.sensors
      .filter(sensor => sensor.airQualityIndex && sensor.airQualityIndex > 0)
      .map(sensor => ({
        sensorId: sensor.id,
        name: sensor.name,
        location: sensor.city || 'Dakar',
        currentAQI: sensor.airQualityIndex || 0
      }))
      .sort((a, b) => b.currentAQI - a.currentAQI)
      .slice(0, 5);
  }

  // ============================================
  // NAVIGATION METHODS
  // ============================================

  navigateToAlerts(severity?: string): void {
    if (severity) {
      this.router.navigate(['/dashboard/alerts'], { queryParams: { severity: severity } });
    } else {
      this.router.navigate(['/dashboard/alerts']);
    }
  }

  navigateToSensor(sensorId: string): void {
    this.router.navigate(['/dashboard/sensors', sensorId]);
  }

  // ============================================
  // CLEANUP
  // ============================================

  ngOnDestroy(): void {
    if (this.trendChart) {
      this.trendChart.destroy();
      this.trendChart = undefined;
    }
  }
}
