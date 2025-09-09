// src/app/components/hero/hero.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SensorService } from '../../services/sensor';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.html',
  styleUrls: ['./hero.css']
})
export class Hero implements OnInit {

  public isLoading = true;
  public heroContent = {
    backgroundClass: 'hero-bg-loading',
    title: 'Bienvenue sur AirLight',
    subtitle: 'Analyse de la qualité de l\'air en temps réel pour un avenir plus sain.'
  };

  constructor(private sensorService: SensorService) {}

  ngOnInit(): void {
    this.loadHeroData();
  }

  loadHeroData(): void {
    this.isLoading = true;
    // On récupère les données du capteur principal
    this.sensorService.getLatestSensorData('d83bdad43d8').subscribe({
      next: (response) => {
        if (response.success) {
          this.updateHeroContent(response.data.airQualityIndex);
        } else {
          // En cas d'erreur, on affiche un état neutre
          this.updateHeroContent(50); 
        }
        this.isLoading = false;
      },
      error: () => {
        this.updateHeroContent(50); // État neutre
        this.isLoading = false;
      }
    });
  }

  updateHeroContent(aqi: number): void {
    if (aqi <= 50) {
      this.heroContent = {
        backgroundClass: 'hero-bg-good',
        title: 'Respirez, l\'air est <span class="hero-highlight">excellent</span> aujourd\'hui !',
        subtitle: 'C\'est le moment idéal pour profiter des activités en plein air.'
      };
    } else if (aqi <= 100) {
      this.heroContent = {
        backgroundClass: 'hero-bg-moderate',
        title: 'Qualité de l\'air <span class="hero-highlight">modérée</span>, restez informés.',
        subtitle: 'La qualité de l\'air est acceptable, mais une surveillance est recommandée pour les personnes sensibles.'
      };
    } else if (aqi <= 150) {
      this.heroContent = {
        backgroundClass: 'hero-bg-unhealthy',
        title: 'Attention, l\'air est <span class="hero-highlight">mauvais</span> pour les groupes sensibles.',
        subtitle: 'Il est conseillé de limiter les efforts intenses à l\'extérieur.'
      };
    } else {
      this.heroContent = {
        backgroundClass: 'hero-bg-hazardous',
        title: 'Alerte : Qualité de l\'air <span class="hero-highlight">dangereuse</span>.',
        subtitle: 'Il est fortement recommandé de réduire votre exposition et de rester à l\'intérieur.'
      };
    }
  }

  // Fonction pour faire défiler la page jusqu'à la section suivante
  scrollToStatus(): void {
    document.getElementById('current-status')?.scrollIntoView({ behavior: 'smooth' });
  }
}
