// src/app/components/air-quality/air-quality.ts

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { PredictionService } from '../../services/prediction'; // <-- Importez le service

@Component({
  selector: 'app-air-quality',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './air-quality.html',
  styleUrls: ['./air-quality.css']
})
export class AirQuality implements OnInit, AfterViewInit, OnDestroy {
  
  @ViewChild('airQualityChart') private chartCanvas!: ElementRef<HTMLCanvasElement>;
  private airQualityChart?: Chart;
  public isLoading = true;
  public errorMessage: string | null = null;

  constructor(private predictionService: PredictionService) { // <-- Injectez le service
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    // La logique est dans ngAfterViewInit pour s'assurer que le canvas est prêt
  }

  ngAfterViewInit(): void {
    // 1. Charger les vraies données de prédiction depuis l'API
    this.predictionService.getFuturePredictions('d83bdad43d8').subscribe({
      next: (response) => {
        if (response.success && response.data.length > 0) {
          // 2. Préparer les données pour le graphique
          const chartData = this.prepareChartData(response.data);
          // 3. Créer le graphique
          this.createChart(chartData);
        } else {
          this.errorMessage = "Aucune prédiction disponible pour le moment.";
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = "Erreur lors du chargement des prédictions.";
        this.isLoading = false;
      }
    });
  }

  // Prépare les données reçues de l'API pour Chart.js
  prepareChartData(predictions: any[]): { labels: string[], data: number[] } {
    // On ne garde que les 72 prochaines heures (3 jours)
    const filteredPredictions = predictions.slice(0, 72);

    const labels = filteredPredictions.map(p => {
      const date = new Date(p.predictionFor);
      return date.getHours() === 0 ? 
        date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 
        `${date.getHours()}h`;
    });

    const data = filteredPredictions.map(p => p.predictedAQI);

    return { labels, data };
  }

  // Crée et configure le graphique en barres
  createChart(chartData: { labels: string[], data: number[] }): void {
    const canvas = this.chartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.airQualityChart) this.airQualityChart.destroy();

    this.airQualityChart = new Chart(ctx, {
      type: 'bar', // <-- Type de graphique en barres
      data: {
        labels: chartData.labels,
        datasets: [{
          label: "Indice Qualité de l'Air Prédit",
          data: chartData.data,
          // Couleur de chaque barre définie dynamiquement
          backgroundColor: chartData.data.map(aqi => {
            if (aqi <= 50) return 'rgba(25, 135, 84, 0.7)';   // Vert
            if (aqi <= 100) return 'rgba(255, 193, 7, 0.7)';  // Jaune
            if (aqi <= 150) return 'rgba(253, 126, 20, 0.7)'; // Orange
            return 'rgba(220, 53, 69, 0.7)';                 // Rouge
          }),
          borderColor: chartData.data.map(aqi => {
            if (aqi <= 50) return '#198754';
            if (aqi <= 100) return '#ffc107';
            if (aqi <= 150) return '#fd7e14';
            return '#dc3545';
          }),
          borderWidth: 1,
          borderRadius: 4, // Bords arrondis pour les barres
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 200,
            title: {
              display: true,
              text: 'Indice AQI'
            }
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.airQualityChart) {
      this.airQualityChart.destroy();
    }
  }
}
