// src/app/components/air-quality/air-quality.ts - CORRIGÉ

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import { PredictionService } from '../../services/prediction';
import { CurrentSensorService } from '../../services/current-sensor.service';
import { Sensor } from '../../services/sensor';

@Component({
  selector: 'app-air-quality',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './air-quality.html',
  styleUrls: ['./air-quality.css']
})
export class AirQuality implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('airQualityChart') private chartCanvas!: ElementRef<HTMLCanvasElement>;
  private airQualityChart?: Chart;
  public isLoading = true;
  public errorMessage: string | null = null;

  // Variables pour gérer le capteur actuel
  public currentSensor: Sensor | null = null;
  private sensorSubscription?: Subscription;
  private chartReady = false;

  // Gestion de la période de prédiction (par défaut 24h)
  public selectedPeriod: '24h' | '48h' | '72h' | '1w' = '24h';
  public readonly periods = [
    { value: '24h', label: '24 heures', hours: 24 },
    { value: '48h', label: '48 heures', hours: 48 },
    { value: '72h', label: '72 heures', hours: 72 },
    { value: '1w', label: '1 semaine', hours: 168 }
  ];

  constructor(
    private predictionService: PredictionService,
    private currentSensorService: CurrentSensorService
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    // S'abonner aux changements de capteur
    this.sensorSubscription = this.currentSensorService.currentSensor$.subscribe(
      sensor => {
        console.log('📊 Air Quality - Nouveau capteur reçu:', sensor);
        this.currentSensor = sensor;

        // Si le canvas est prêt ET qu'on a un capteur valide, charger les données
        if (this.chartReady && sensor && sensor.id) {
          this.loadPredictions(sensor.id);
        } else if (!sensor) {
          this.isLoading = true;
          this.errorMessage = 'En attente de sélection de capteur...';
        }
      }
    );
  }

  ngAfterViewInit(): void {
    this.chartReady = true;

    // Vérifier si un capteur est déjà disponible
    const currentSensor = this.currentSensorService.getCurrentSensor();
    if (currentSensor && currentSensor.id) {
      console.log('✅ Air Quality - Capteur disponible au démarrage:', currentSensor);
      this.loadPredictions(currentSensor.id);
    } else {
      console.log('⏳ Air Quality - En attente de capteur...');
      this.isLoading = true;
      this.errorMessage = 'Chargement du capteur...';
    }
  }

  /**
   * ✅ NOUVEAU : Gérer le changement de période
   */
  onPeriodChange(): void {
    console.log('📅 Changement de période:', this.selectedPeriod);

    if (this.currentSensor && this.currentSensor.id) {
      this.loadPredictions(this.currentSensor.id);
    }
  }

  /**
   * ✅ NOUVEAU : Obtenir le nombre d'heures selon la période sélectionnée
   */
  private getHoursForPeriod(): number {
    const period = this.periods.find(p => p.value === this.selectedPeriod);
    return period ? period.hours : 24; // Par défaut 24h
  }

  /**
   * ✅ CORRIGÉ : Charge les prédictions avec le paramètre hours
   */
  loadPredictions(sensorId: string): void {
    // Validation du sensorId
    if (!sensorId || sensorId.trim() === '') {
      console.warn('⚠️ Tentative de chargement avec sensorId invalide');
      this.errorMessage = 'Capteur non valide';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    // ✅ Récupérer le nombre d'heures selon la période sélectionnée
    const hours = this.getHoursForPeriod();
    console.log(`📈 Chargement des prédictions pour: ${sensorId} - Période: ${this.selectedPeriod} (${hours}h)`);

    // ✅ CORRECTION : Passer le paramètre hours au service
    this.predictionService.getFuturePredictions(sensorId, hours).subscribe({
      next: (response) => {
        console.log(`✅ Prédictions reçues:`, response);

        if (response.success && response.data && response.data.length > 0) {
          // Préparer les données pour le graphique
          const chartData = this.prepareChartData(response.data);
          // Créer le graphique
          this.createChart(chartData);
        } else {
          this.errorMessage = "Aucune prédiction disponible pour ce capteur.";
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Erreur chargement prédictions:', err);
        this.errorMessage = "Erreur lors du chargement des prédictions.";
        this.isLoading = false;
      }
    });
  }

  /**
   * Prépare les données reçues de l'API pour Chart.js
   */
  prepareChartData(predictions: any[]): { labels: string[], data: number[] } {
    // Les prédictions sont déjà filtrées par le backend selon le paramètre hours
    const labels = predictions.map(p => {
      const date = new Date(p.predictionFor);

      // Affichage adapté selon la période
      if (this.selectedPeriod === '1w') {
        // Pour 1 semaine : afficher jour + date
        return date.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        });
      } else {
        // Pour 24h/48h/72h : afficher heure ou date si minuit
        return date.getHours() === 0 ?
          date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) :
          `${date.getHours()}h`;
      }
    });

    const data = predictions.map(p => p.predictedAQI);

    console.log(`📊 Graphique préparé: ${labels.length} points de données`);
    return { labels, data };
  }

  /**
   * Retourne la couleur selon les 6 niveaux AQI
   */
  getAqiColor(aqi: number): { bg: string; border: string } {
    if (aqi <= 50) {
      return { bg: 'rgba(25, 135, 84, 0.7)', border: '#198754' };
    } else if (aqi <= 100) {
      return { bg: 'rgba(255, 255, 0, 0.7)', border: '#ffe600' };
    } else if (aqi <= 150) {
      return { bg: 'rgba(255, 126, 0, 0.7)', border: '#ff7e00' };
    } else if (aqi <= 200) {
      return { bg: 'rgba(255, 0, 0, 0.7)', border: '#ff0000' };
    } else if (aqi <= 300) {
      return { bg: 'rgba(143, 63, 151, 0.7)', border: '#8f3f97' };
    } else {
      return { bg: 'rgba(101, 67, 33, 0.7)', border: '#654321' };
    }
  }

  /**
   * Crée et configure le graphique en barres
   */
  createChart(chartData: { labels: string[], data: number[] }): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) {
      console.warn('⚠️ Canvas non disponible pour créer le graphique');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('⚠️ Impossible d\'obtenir le contexte 2D du canvas');
      return;
    }

    // Détruire le graphique existant si présent
    if (this.airQualityChart) {
      this.airQualityChart.destroy();
    }

    this.airQualityChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: "Indice Qualité de l'Air Prédit",
          data: chartData.data,
          backgroundColor: chartData.data.map(aqi => this.getAqiColor(aqi).bg),
          borderColor: chartData.data.map(aqi => this.getAqiColor(aqi).border),
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const aqi = context.parsed.y;
                if (aqi === null || aqi === undefined) {
                  return 'AQI: N/A';
                }

                let level = '';
                if (aqi <= 50) level = 'Bon';
                else if (aqi <= 100) level = 'Modéré';
                else if (aqi <= 150) level = 'Sensible';
                else if (aqi <= 200) level = 'Mauvais';
                else if (aqi <= 300) level = 'Très mauvais';
                else level = 'Dangereux';

                return `AQI: ${aqi} (${level})`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 350,
            title: {
              display: true,
              text: 'Indice AQI'
            }
          }
        }
      }
    });

    console.log('✅ Graphique créé avec succès');
  }

  ngOnDestroy(): void {
    // Détruire le graphique
    if (this.airQualityChart) {
      this.airQualityChart.destroy();
    }

    // Se désabonner du service
    if (this.sensorSubscription) {
      this.sensorSubscription.unsubscribe();
    }
  }
}
