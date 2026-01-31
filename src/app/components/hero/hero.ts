// src/app/components/hero/hero.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SensorService } from '../../services/sensor';
import { CurrentSensorService } from '../../services/current-sensor.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.html',
  styleUrls: ['./hero.css']
})
export class Hero implements OnInit, OnDestroy {

  public isLoading = true;
  public heroContent = {
    backgroundClass: 'hero-bg-loading',
    title: 'Bienvenue sur AirLight',
    subtitle: 'Analyse de la qualité de l\'air en temps réel pour un avenir plus sain.'
  };

  // Subscription pour écouter le capteur actuel
  private sensorSubscription?: Subscription;

  constructor(
    private sensorService: SensorService,
    private currentSensorService: CurrentSensorService
  ) {}

  ngOnInit(): void {
    // ✅ S'abonner aux changements de capteur
    this.sensorSubscription = this.currentSensorService.currentSensor$.subscribe(
      sensor => {
        if (sensor && sensor.id) {
          console.log('🎨 Hero - Nouveau capteur reçu:', sensor);
          this.loadHeroData(sensor.id);
        } else {
          // ✅ Si pas de capteur, afficher l'état de chargement
          console.log('⏳ Hero - En attente de capteur...');
          this.isLoading = true;
          this.heroContent = {
            backgroundClass: 'hero-bg-loading',
            title: 'Bienvenue sur AirLight',
            subtitle: 'Chargement des données en cours...'
          };
        }
      }
    );

    // ✅ Vérifier si un capteur est déjà disponible au démarrage
    const currentSensor = this.currentSensorService.getCurrentSensor();
    if (currentSensor && currentSensor.id) {
      console.log('✅ Hero - Capteur disponible au démarrage:', currentSensor);
      this.loadHeroData(currentSensor.id);
    } else {
      console.log('⏳ Hero - Aucun capteur au démarrage, attente...');
    }
  }

  loadHeroData(sensorId: string): void {
    // ✅ Validation du sensorId
    if (!sensorId || sensorId.trim() === '') {
      console.warn('⚠️ Hero - Tentative de chargement avec sensorId invalide');
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    console.log('🎨 Chargement Hero pour capteur:', sensorId);

    // On récupère les données du capteur
    this.sensorService.getLatestSensorData(sensorId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.updateHeroContent(response.data.airQualityIndex);
        } else {
          // En cas d'erreur, on affiche un état neutre
          console.warn('⚠️ Hero - Pas de données disponibles');
          this.updateHeroContent(50);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Hero - Erreur chargement données:', err);
        this.updateHeroContent(50); // État neutre
        this.isLoading = false;
      }
    });
  }

  /**
   * ✅ MISE À JOUR : 6 niveaux AQI
   */
  updateHeroContent(aqi: number): void {
    // ✅ Validation de l'AQI
    if (aqi === null || aqi === undefined || isNaN(aqi)) {
      console.warn('⚠️ Hero - AQI invalide, utilisation valeur par défaut');
      aqi = 50; // Valeur par défaut
    }

    if (aqi <= 50) {
      // Bon (0-50)
      this.heroContent = {
        backgroundClass: 'hero-bg-good',
        title: 'Respirez, l\'air est <span class="hero-highlight">excellent</span> aujourd\'hui !',
        subtitle: 'C\'est le moment idéal pour profiter des activités en plein air.'
      };
    } else if (aqi <= 100) {
      // Modéré (51-100)
      this.heroContent = {
        backgroundClass: 'hero-bg-moderate',
        title: 'Qualité de l\'air <span class="hero-highlight">modérée</span>, restez informés.',
        subtitle: 'La qualité de l\'air est acceptable, mais une surveillance est recommandée pour les personnes sensibles.'
      };
    } else if (aqi <= 150) {
      // Sensible (101-150)
      this.heroContent = {
        backgroundClass: 'hero-bg-sensitive',
        title: 'Attention, l\'air est <span class="hero-highlight">sensible</span> pour certains groupes.',
        subtitle: 'Les personnes sensibles devraient limiter les efforts prolongés en extérieur.'
      };
    } else if (aqi <= 200) {
      // Mauvais (151-200)
      this.heroContent = {
        backgroundClass: 'hero-bg-unhealthy',
        title: 'L\'air est <span class="hero-highlight">mauvais</span> pour la santé.',
        subtitle: 'Tout le monde devrait limiter les efforts intenses à l\'extérieur.'
      };
    } else if (aqi <= 300) {
      // Très mauvais (201-300)
      this.heroContent = {
        backgroundClass: 'hero-bg-very-unhealthy',
        title: 'Alerte : Air <span class="hero-highlight">très mauvais</span>.',
        subtitle: 'Évitez toute activité physique en extérieur. Les groupes sensibles doivent rester à l\'intérieur.'
      };
    } else {
      // Dangereux (301+)
      this.heroContent = {
        backgroundClass: 'hero-bg-hazardous',
        title: 'Urgence : Qualité de l\'air <span class="hero-highlight">dangereuse</span>.',
        subtitle: 'Il est fortement recommandé de rester à l\'intérieur et de limiter toute exposition.'
      };
    }

    console.log(`🎨 Hero mis à jour - AQI: ${aqi}, Classe: ${this.heroContent.backgroundClass}`);
  }

  // Fonction pour faire défiler la page jusqu'à la section suivante
  scrollToStatus(): void {
    const element = document.getElementById('current-status');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.warn('⚠️ Élément #current-status non trouvé');
    }
  }

  ngOnDestroy(): void {
    // ✅ Se désabonner pour éviter les fuites mémoire
    if (this.sensorSubscription) {
      this.sensorSubscription.unsubscribe();
    }
  }
}
