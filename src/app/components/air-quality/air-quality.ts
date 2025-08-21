import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importation des éléments de Chart.js
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-air-quality',
  standalone: true,
  imports: [CommonModule,],
  templateUrl: './air-quality.html',
  styleUrls: ['./air-quality.css']
})
export class AirQuality implements OnInit, AfterViewInit, OnDestroy {
  // @ViewChild permet de récupérer une référence à un élément du template (ici, le <canvas>)
  @ViewChild('airQualityChart') private chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  private airQualityChart?: Chart; // Instance du graphique
  isLoading = true;

  constructor() {
    // Il est nécessaire d'enregistrer les composants de Chart.js pour qu'ils fonctionnent en mode "tree-shaking"
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    // La logique de création du graphique est déplacée dans ngAfterViewInit
    // pour s'assurer que le <canvas> est bien présent dans le DOM.
  }

  ngAfterViewInit(): void {
    // Simule le chargement des données et crée le graphique
    setTimeout(() => {
      const mockData = this.generateMockAirQualityData();
      this.createChart(mockData);
      this.isLoading = false;
    }, 1000); // Simule une attente de 1 seconde
  }

  // Génère des données simulées pour le graphique sur 72 heures
  generateMockAirQualityData(): { labels: string[], data: number[] } {
    const data: number[] = [];
    const labels: string[] = [];
    const now = new Date();
    
    for (let i = 0; i < 72; i++) {
      const date = new Date(now.getTime() + (i * 60 * 60 * 1000));
      // Affiche le jour pour la première heure (0h)
      labels.push(date.getHours() === 0 ? 
        date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 
        `${date.getHours()}h`);
      
      // Formule pour générer des données qui ressemblent à un cycle journalier
      const baseValue = 50 + Math.sin(i / 12 * Math.PI) * 40;
      const noise = (Math.random() - 0.5) * 20;
      data.push(Math.max(10, Math.min(180, baseValue + noise)));
    }
    
    return { labels, data };
  }

  // Crée et configure le graphique
  createChart(airQualityData: { labels: string[], data: number[] }): void {
    const canvas = this.chartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Impossible de récupérer le contexte du canvas.');
      return;
    }

    // Détruit l'ancienne instance du graphique si elle existe
    if (this.airQualityChart) {
      this.airQualityChart.destroy();
    }

    this.airQualityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: airQualityData.labels,
        datasets: [{
          label: "Indice Qualité de l'Air",
          data: airQualityData.data,
          borderColor: '#0d6efd', // Bleu Bootstrap
          tension: 0.4,
          fill: true,
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          pointBackgroundColor: (context) => {
            const value = context.parsed.y;
            if (value <= 50) return '#198754'; // Vert (success)
            if (value <= 100) return '#ffc107'; // Jaune (warning)
            if (value <= 150) return '#fd7e14'; // Orange (orange)
            return '#dc3545'; // Rouge (danger)
          },
          pointRadius: 4,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
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
            min: 0,
            max: 200,
          }
        }
      }
    });
  }

  // OnDestroy est appelé quand le composant est détruit.
  // C'est une bonne pratique pour nettoyer les ressources et éviter les fuites de mémoire.
  ngOnDestroy(): void {
    if (this.airQualityChart) {
      this.airQualityChart.destroy();
    }
  }
}
