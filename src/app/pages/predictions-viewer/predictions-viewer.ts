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
  
  public historicalPredictions: Prediction[] = [];
  public futurePredictions: Prediction[] = [];
  public modelAccuracy: any = null;

  public isLoading = true;

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
    this.sensorService.getSensors().subscribe(response => {
      if (response.success && response.data.length > 0) {
        this.sensors = response.data;
        this.selectedSensorId = this.sensors[0].id;
        this.onSensorChange();
      } else {
        this.isLoading = false;
      }
    });
  }

  onSensorChange(): void {
    if (!this.selectedSensorId) return;
    
    this.isLoading = true;
    const sensorId = this.selectedSensorId;

    // Récupérer toutes les données en parallèle
    this.predictionService.getRecentPredictions(sensorId, 12).subscribe(h => {
      this.historicalPredictions = h.data || [];
      this.predictionService.getFuturePredictions(sensorId).subscribe(f => {
        this.futurePredictions = f.data || [];
        this.predictionService.getAccuracy(sensorId).subscribe(a => {
          this.modelAccuracy = a.data?.accuracy || null;
          this.isLoading = false;
          setTimeout(() => this.initPredictionChart(), 0);
        });
      });
    });
  }

  initPredictionChart(): void {
    if (!this.predictionChartCanvas) return;

    const ctx = this.predictionChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Inverser les prédictions historiques pour un ordre chronologique
    const historical = [...this.historicalPredictions].reverse();

    const labels = [
      ...historical.map(p => new Date(p.predictionFor).toLocaleTimeString('fr-FR', { hour: '2-digit' }) + 'h'),
      ...this.futurePredictions.map(p => new Date(p.predictionFor).toLocaleTimeString('fr-FR', { hour: '2-digit' }) + 'h')
    ];
    
    const historicalData = [
      ...historical.map(p => p.predictedPM25),
      // Remplir avec null pour la partie future
      ...this.futurePredictions.map(() => null)
    ];

    const futureData = [
      // Remplir avec null pour la partie historique
      ...historical.map(() => null),
      ...this.futurePredictions.map(p => p.predictedPM25)
    ];

    if (this.predictionChart) this.predictionChart.destroy();

    this.predictionChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Données (passées)',
            data: historicalData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Prédictions (futures)',
            data: futureData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderDash: [5, 5],
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  ngOnDestroy(): void {
    if (this.predictionChart) this.predictionChart.destroy();
  }
}
