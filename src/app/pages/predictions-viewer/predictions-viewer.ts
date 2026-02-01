import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PredictionService, Prediction } from '../../services/prediction';
import { SensorService, Sensor } from '../../services/sensor';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-predictions-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './predictions-viewer.html',
  styleUrls: ['./predictions-viewer.css']
})
export class PredictionsViewer implements OnInit, OnDestroy {

  @ViewChild('predictionChart') private predictionChartCanvas!: ElementRef<HTMLCanvasElement>;
  private predictionChart?: Chart;

  public sensors: Sensor[] = [];
  public selectedSensorId: string | null = null;
  public selectedPeriod: number = 72;

  public historicalPredictions: Prediction[] = [];
  public futurePredictions: Prediction[] = [];
  public modelAccuracy: any = null;
  public lastTrainingDate: string = 'N/A';

  public isLoading = true;

  // ─── Pagination ─────────────────────────────────────────────
  public readonly PAGE_SIZE = 8;
  public currentPage = 1;

  public periodOptions = [
    { label: '24 heures', value: 24 },
    { label: '48 heures', value: 48 },
    { label: '72 heures (3 jours)', value: 72 },
    { label: '1 semaine (168h)', value: 168 }
  ];

  constructor(
    private predictionService: PredictionService,
    private sensorService: SensorService
  ) {
    Chart.register(...registerables);
  }

  // ─── Pagination : propriétés calculées ──────────────────────
  get totalPages(): number {
    return Math.ceil(this.futurePredictions.length / this.PAGE_SIZE) || 1;
  }

  /** Slice de la page courante */
  get paginatedPredictions(): Prediction[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.futurePredictions.slice(start, start + this.PAGE_SIZE);
  }

  /** "1–8 de 168" */
  get paginationStart(): number {
    return this.futurePredictions.length === 0 ? 0 : (this.currentPage - 1) * this.PAGE_SIZE + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.PAGE_SIZE, this.futurePredictions.length);
  }

  /** Navigation vers une page précise */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  /**
   * Génère le tableau de numéros de pages à afficher avec élidage.
   * Retourne par exemple [1, 2, 3, -1, 20] où -1 = "..."
   * Stratégie : toujours montrer la première, la dernière, et 2 autour du courant.
   */
  visiblePages(): number[] {
    const total = this.totalPages;
    if (total <= 7) {
      // Peu de pages → tout afficher
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const current = this.currentPage;
    const pages: number[] = [];

    // Toujours la première
    pages.push(1);

    // Si le courant est loin du début → ellipsis
    if (current > 3) {
      pages.push(-1); // "..."
    }

    // Pages autour du courant
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Si le courant est loin de la fin → ellipsis
    if (current < total - 2) {
      pages.push(-1); // "..."
    }

    // Toujours la dernière
    pages.push(total);

    return pages;
  }

  // ─── Cycle de vie ────────────────────────────────────────────
  ngOnInit(): void {
    this.loadSensors();
  }

  loadSensors(): void {
    this.isLoading = true;
    this.sensorService.getSensors().subscribe({
      next: (response) => {
        if (response.success && response.data.length > 0) {
          this.sensors = response.data;
          this.selectedSensorId = this.sensors[0].id;
          this.loadPredictions();
        } else {
          this.isLoading = false;
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  onSensorChange(): void {
    this.currentPage = 1; // Retour page 1 à chaque changement de capteur
    this.loadPredictions();
  }

  onPeriodChange(): void {
    this.currentPage = 1; // Retour page 1 à chaque changement de période
    this.loadPredictions();
  }

  loadPredictions(): void {
    if (!this.selectedSensorId) return;

    this.isLoading = true;
    const sensorId = this.selectedSensorId;
    const hours = this.selectedPeriod;

    this.predictionService.getRecentPredictions(sensorId, 12).subscribe({
      next: (h) => {
        this.historicalPredictions = h.data || [];

        this.predictionService.getFuturePredictions(sensorId, hours).subscribe({
          next: (f) => {
            this.futurePredictions = f.data || [];
            this.currentPage = 1; // Reset pagination

            this.predictionService.getAccuracy(sensorId).subscribe({
              next: (a) => {
                this.modelAccuracy = a.data || null;
                this.calculateLastTraining();
                this.isLoading = false;
                setTimeout(() => this.initPredictionChart(), 100);
              },
              error: () => {
                this.modelAccuracy = null;
                this.isLoading = false;
                setTimeout(() => this.initPredictionChart(), 100);
              }
            });
          },
          error: () => {
            this.futurePredictions = [];
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.historicalPredictions = [];
        this.isLoading = false;
      }
    });
  }

  calculateLastTraining(): void {
    const allPredictions = [...this.historicalPredictions, ...this.futurePredictions];
    if (allPredictions.length === 0) {
      this.lastTrainingDate = 'Jamais';
      return;
    }

    const latestPrediction = allPredictions.reduce((latest, pred) => {
      const predDate = new Date((pred as any).createdAt || pred.predictionFor);
      const latestDate = new Date((latest as any).createdAt || latest.predictionFor);
      return predDate > latestDate ? pred : latest;
    });

    const createdAt = new Date((latestPrediction as any).createdAt || latestPrediction.predictionFor);
    const diffHours = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) this.lastTrainingDate = 'Il y a < 1h';
    else if (diffHours < 24) this.lastTrainingDate = `Il y a ${diffHours}h`;
    else if (diffDays === 1) this.lastTrainingDate = 'Il y a 1 jour';
    else this.lastTrainingDate = `Il y a ${diffDays} jours`;
  }

  // ─── Graphique amélioré ─────────────────────────────────────
  initPredictionChart(): void {
    if (!this.predictionChartCanvas) return;

    const ctx = this.predictionChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const historical = [...this.historicalPredictions].reverse();

    // ← Labels fusionnés : historique + futur
    const labels = [
      ...historical.map(p => this.formatLabel(p.predictionFor)),
      ...this.futurePredictions.map(p => this.formatLabel(p.predictionFor))
    ];

    const histLen = historical.length;

    // ← Dataset historique (données réelles)
    const historicalData: (number | null)[] = [
      ...historical.map(p => p.predictedPM25),
      ...this.futurePredictions.map(() => null)
    ];

    // ← Dataset prédictions futures : commence par le dernier point historique
    //    pour créer une jonction visuelle continue
    const futureData: (number | null)[] = [
      ...historical.map((_, i) => i === histLen - 1 ? historical[i].predictedPM25 : null),
      ...this.futurePredictions.map(p => p.predictedPM25)
    ];

    // ← Confidence band supérieure : pm25 + (1 - confidence) * pm25 * 0.4
    const upperBound: (number | null)[] = [
      ...historical.map(() => null),
      ...this.futurePredictions.map(p => {
        const spread = (1 - p.confidence) * p.predictedPM25 * 0.5;
        return parseFloat((p.predictedPM25 + spread).toFixed(2));
      })
    ];

    // ← Confidence band inférieure
    const lowerBound: (number | null)[] = [
      ...historical.map(() => null),
      ...this.futurePredictions.map(p => {
        const spread = (1 - p.confidence) * p.predictedPM25 * 0.5;
        return parseFloat(Math.max(0, p.predictedPM25 - spread).toFixed(2));
      })
    ];

    if (this.predictionChart) {
      this.predictionChart.destroy();
    }

    // Index de la ligne verticale "Maintenant"
    const nowLineIndex = histLen - 1;

    this.predictionChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          // 0 — Upper bound (invisible, sert de référence pour le fill vers le dataset 2)
          {
            label: '',
            data: upperBound,
            borderColor: 'rgba(239, 68, 68, 0)',
            backgroundColor: 'rgba(239, 68, 68, 0)',
            pointRadius: 0,
            borderWidth: 0,
            fill: false,
            tension: 0.4
          },
          // 1 — Prédictions futures (ligne principale rouge tirets)
          {
            label: 'Prédictions futures',
            data: futureData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            borderDash: [6, 3],
            borderWidth: 2.5,
            fill: true, // fill vers le bas (vers 0) pour un effet léger
            tension: 0.4,
            pointRadius: (ctx: any) => {
              // Afficher un point uniquement au point de jonction
              const idx = ctx.dataIndex;
              return idx === histLen - 1 ? 5 : 0;
            },
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          // 2 — Lower bound (fill vers le dataset 0 = zone d'incertitude)
          {
            label: 'Zone de confiance',
            data: lowerBound,
            borderColor: 'rgba(239, 68, 68, 0)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            pointRadius: 0,
            borderWidth: 0,
            fill: { target: 0 },
            tension: 0.4
          },
          // 3 — Données historiques (ligne bleue pleine)
          {
            label: 'Données passées',
            data: historicalData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            pointRadius: 2,
            pointHoverRadius: 5,
            pointBackgroundColor: '#3b82f6'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              filter: (item: any) => {
                // Cacher le dataset upper bound (label vide)
                return item.text !== '';
              },
              usePointStyle: true,
              pointStyleWidth: 12
            }
          },
          tooltip: {
            filter: (item: any) => {
              // Cacher upper/lower bound dans les tooltips
              return item.dataset.label !== '' && item.dataset.label !== 'Zone de confiance';
            },
            callbacks: {
              label: function(context: any) {
                const label = context.dataset.label || '';
                if (context.parsed.y !== null) {
                  return `${label}: ${context.parsed.y.toFixed(1)} µg/m³`;
                }
                return '';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'PM2.5 (µg/m³)' },
            grid: { color: 'rgba(0,0,0,0.06)' }
          },
          x: {
            title: { display: true, text: 'Date et heure' },
            ticks: { maxRotation: 45, minRotation: 45, maxTicksLimit: 14 },
            grid: { display: false }
          }
        }
      },
      plugins: [
        // ← Plugin custom : ligne verticale "Maintenant" à la jonction
        {
          id: 'nowLine',
          afterDraw(chart: any) {
            if (histLen < 1) return;

            const ctx = chart.ctx;
            const xScale = chart.scales.x;
            const yScale = chart.scales.y;
            const x = xScale.getPixelForValue(nowLineIndex);
            const topY = yScale.top;
            const bottomY = yScale.bottom;

            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = 'rgba(107, 114, 128, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Label "Maintenant"
            ctx.fillStyle = '#6b7280';
            ctx.font = '11px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Maintenant', x, topY - 8);
            ctx.restore();
          }
        }
      ]
    });
  }

  private formatLabel(dateStr: string): string {
    const d = new Date(dateStr);
    const day = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${day} ${time}`;
  }

  // ─── Accuracy helpers ───────────────────────────────────────
  getAccuracyValue(): string {
    if (!this.modelAccuracy || !this.modelAccuracy.accuracy) return '0';
    return this.modelAccuracy.accuracy;
  }

  getAccuracyClass(): string {
    const v = parseFloat(this.getAccuracyValue());
    if (v >= 80) return 'text-success';
    if (v >= 60) return 'text-primary';
    if (v >= 40) return 'text-warning';
    return 'text-danger';
  }

  getPerformanceBadgeClass(): string {
    if (!this.modelAccuracy?.performanceLevel) return 'bg-secondary';
    const map: Record<string, string> = {
      excellent: 'bg-success',
      good: 'bg-primary',
      fair: 'bg-warning',
      poor: 'bg-danger'
    };
    return map[this.modelAccuracy.performanceLevel] || 'bg-secondary';
  }

  getPerformanceLevelText(): string {
    if (!this.modelAccuracy?.performanceLevel) return 'N/A';
    const map: Record<string, string> = {
      excellent: 'Excellent',
      good: 'Bon',
      fair: 'Moyen',
      poor: 'Faible'
    };
    return map[this.modelAccuracy.performanceLevel] || 'Inconnu';
  }

  ngOnDestroy(): void {
    if (this.predictionChart) {
      this.predictionChart.destroy();
    }
  }
}