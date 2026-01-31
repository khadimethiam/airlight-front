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
  public selectedPeriod: number = 168; // Par défaut 7 jours (168h)
  
  public historicalPredictions: Prediction[] = [];
  public futurePredictions: Prediction[] = [];
  public modelAccuracy: any = null;
  public lastTrainingDate: string = 'N/A';

  public isLoading = true;

  // Options de période
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
          console.warn('⚠️ Aucun capteur trouvé');
        }
      },
      error: (error) => {
        console.error('❌ Erreur chargement capteurs:', error);
        this.isLoading = false;
      }
    });
  }

  onSensorChange(): void {
    console.log(`🔄 Changement de capteur: ${this.selectedSensorId}`);
    this.loadPredictions();
  }

  onPeriodChange(): void {
    console.log(`🔄 Changement de période: ${this.selectedPeriod}h`);
    this.loadPredictions();
  }

  loadPredictions(): void {
    if (!this.selectedSensorId) return;
    
    this.isLoading = true;
    const sensorId = this.selectedSensorId;
    const hours = this.selectedPeriod;

    console.log(`📊 Chargement des prédictions pour ${sensorId} sur ${hours}h...`);

    // Récupérer les données en parallèle
    this.predictionService.getRecentPredictions(sensorId, 12).subscribe({
      next: (h) => {
        console.log('✅ Prédictions historiques:', h);
        this.historicalPredictions = h.data || [];
        
        // Récupérer prédictions futures selon la période sélectionnée
        this.predictionService.getFuturePredictions(sensorId, hours).subscribe({
          next: (f) => {
            console.log('✅ Prédictions futures:', f);
            this.futurePredictions = f.data || [];
            
            // Si aucune prédiction future, afficher un message informatif
            if (this.futurePredictions.length === 0) {
              console.info('ℹ️ Aucune prédiction future disponible. Elles seront générées automatiquement par le système.');
            }
            
            // Récupérer accuracy
            this.predictionService.getAccuracy(sensorId).subscribe({
              next: (a) => {
                console.log('✅ Accuracy reçue:', a);
                this.modelAccuracy = a.data || null;
                
                // Calculer la date du dernier entraînement si disponible
                this.calculateLastTraining();
                
                this.isLoading = false;
                setTimeout(() => this.initPredictionChart(), 100);
              },
              error: (error) => {
                console.error('❌ Erreur accuracy:', error);
                this.modelAccuracy = null;
                this.isLoading = false;
              }
            });
          },
          error: (error) => {
            console.error('❌ Erreur prédictions futures:', error);
            this.futurePredictions = [];
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('❌ Erreur prédictions historiques:', error);
        this.historicalPredictions = [];
        this.isLoading = false;
      }
    });
  }

  calculateLastTraining(): void {
    // Calculer depuis les prédictions les plus récentes
    const allPredictions = [...this.historicalPredictions, ...this.futurePredictions];
    
    if (allPredictions.length === 0) {
      this.lastTrainingDate = 'Jamais';
      return;
    }

    // Trouver la prédiction la plus récente (createdAt)
    const latestPrediction = allPredictions.reduce((latest, pred) => {
      const predDate = new Date((pred as any).createdAt || pred.predictionFor);
      const latestDate = new Date((latest as any).createdAt || latest.predictionFor);
      return predDate > latestDate ? pred : latest;
    });

    const createdAt = new Date((latestPrediction as any).createdAt || latestPrediction.predictionFor);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      this.lastTrainingDate = 'Il y a < 1h';
    } else if (diffHours < 24) {
      this.lastTrainingDate = `Il y a ${diffHours}h`;
    } else if (diffDays === 1) {
      this.lastTrainingDate = 'Il y a 1 jour';
    } else {
      this.lastTrainingDate = `Il y a ${diffDays} jours`;
    }
  }

  initPredictionChart(): void {
    if (!this.predictionChartCanvas) {
      console.warn('⚠️ Canvas non disponible pour le graphique');
      return;
    }

    const ctx = this.predictionChartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('❌ Impossible d\'obtenir le contexte 2D du canvas');
      return;
    }

    // Inverser les prédictions historiques pour un ordre chronologique
    const historical = [...this.historicalPredictions].reverse();

    const labels = [
      ...historical.map(p => {
        const date = new Date(p.predictionFor);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' + 
               date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      }),
      ...this.futurePredictions.map(p => {
        const date = new Date(p.predictionFor);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' + 
               date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      })
    ];
    
    const historicalData = [
      ...historical.map(p => p.predictedPM25),
      ...this.futurePredictions.map(() => null)
    ];

    const futureData = [
      ...historical.map(() => null),
      ...this.futurePredictions.map(p => p.predictedPM25)
    ];

    // Détruire le graphique existant
    if (this.predictionChart) {
      this.predictionChart.destroy();
    }

    // Créer le nouveau graphique
    this.predictionChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Données passées',
            data: historicalData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5
          },
          {
            label: 'Prédictions futures',
            data: futureData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderDash: [5, 5],
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5
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
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toFixed(1) + ' µg/m³';
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'PM2.5 (µg/m³)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date et heure'
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    });

    console.log('✅ Graphique initialisé avec succès');
  }

  // Méthodes pour gérer l'accuracy
  getAccuracyValue(): string {
    if (!this.modelAccuracy || !this.modelAccuracy.accuracy) {
      return '0';
    }
    // L'accuracy vient en string comme "65.3"
    return this.modelAccuracy.accuracy;
  }

  getAccuracyClass(): string {
    const accuracy = parseFloat(this.getAccuracyValue());
    
    if (accuracy >= 80) return 'text-success';
    if (accuracy >= 60) return 'text-primary';
    if (accuracy >= 40) return 'text-warning';
    return 'text-danger';
  }

  getPerformanceBadgeClass(): string {
    if (!this.modelAccuracy || !this.modelAccuracy.performanceLevel) {
      return 'bg-secondary';
    }

    switch (this.modelAccuracy.performanceLevel) {
      case 'excellent':
        return 'bg-success';
      case 'good':
        return 'bg-primary';
      case 'fair':
        return 'bg-warning';
      case 'poor':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getPerformanceLevelText(): string {
    if (!this.modelAccuracy || !this.modelAccuracy.performanceLevel) {
      return 'N/A';
    }

    const levels: { [key: string]: string } = {
      'excellent': 'Excellent',
      'good': 'Bon',
      'fair': 'Moyen',
      'poor': 'Faible'
    };

    return levels[this.modelAccuracy.performanceLevel] || 'Inconnu';
  }

  ngOnDestroy(): void {
    if (this.predictionChart) {
      this.predictionChart.destroy();
      console.log('🧹 Graphique détruit');
    }
  }
}