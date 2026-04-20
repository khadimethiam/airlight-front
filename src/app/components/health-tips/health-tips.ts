// src/app/components/health-tips/health-tips.ts

import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SensorService } from '../../services/sensor';
import { CurrentSensorService } from '../../services/current-sensor.service';

// Interface pour structurer nos conseils
interface HealthTip {
  icon: string;
  title: string;
  content: string;
  priority?: 'high' | 'low' | 'normal';
  aqiRange?: 'good' | 'moderate' | 'unhealthy' | 'all';
}

@Component({
  selector: 'app-health-tips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './health-tips.html',
  styleUrls: ['./health-tips.css']
})
export class HealthTips implements OnInit, OnDestroy {

  // ✅ LISTE ENRICHIE avec plus de conseils
  private allHealthTips: HealthTip[] = [
    // Conseils pour AIR BON (0-50)
    {
      icon: "fas fa-running",
      title: "Activité physique en extérieur",
      content: "L'air est excellent ! C'est le moment idéal pour faire du jogging, du vélo ou toute activité sportive en plein air.",
      priority: 'low',
      aqiRange: 'good'
    },
    {
      icon: "fas fa-child",
      title: "Sorties avec les enfants",
      content: "Profitez de la bonne qualité de l'air pour emmener vos enfants jouer dehors et profiter des espaces verts.",
      priority: 'low',
      aqiRange: 'good'
    },
    {
      icon: "fas fa-window-maximize",
      title: "Aération du logement",
      content: "Ouvrez grand vos fenêtres pour renouveler l'air intérieur et profiter de l'air frais extérieur.",
      priority: 'low',
      aqiRange: 'good'
    },

    // Conseils pour AIR MODÉRÉ (51-100)
    {
      icon: "fas fa-clock",
      title: "Choisir les bons horaires",
      content: "Privilégiez les activités extérieures tôt le matin ou en fin de journée quand la pollution est généralement plus faible.",
      priority: 'normal',
      aqiRange: 'moderate'
    },
    {
      icon: "fas fa-heartbeat",
      title: "Attention aux personnes sensibles",
      content: "Les enfants, personnes âgées et asthmatiques doivent limiter les efforts prolongés en extérieur.",
      priority: 'normal',
      aqiRange: 'moderate'
    },

    // Conseils pour AIR MAUVAIS (100+)
    {
      icon: "fas fa-home",
      title: "Purifiez votre intérieur",
      content: "Utilisez des purificateurs d'air avec filtres HEPA et gardez vos fenêtres fermées pendant les pics de pollution.",
      priority: 'high',
      aqiRange: 'unhealthy'
    },
    {
      icon: "fas fa-mask",
      title: "Port du masque recommandé",
      content: "Portez un masque N95 ou FFP2 si vous devez sortir, surtout si vous souffrez de problèmes respiratoires.",
      priority: 'high',
      aqiRange: 'unhealthy'
    },
    {
      icon: "fas fa-ban",
      title: "Évitez les efforts intenses",
      content: "Reportez vos activités sportives intenses et privilégiez des exercices doux en intérieur.",
      priority: 'high',
      aqiRange: 'unhealthy'
    },
    {
      icon: "fas fa-hospital",
      title: "Surveillez vos symptômes",
      content: "En cas de difficultés respiratoires, toux ou irritation des yeux, consultez un médecin sans tarder.",
      priority: 'high',
      aqiRange: 'unhealthy'
    },
    {
      icon: "fas fa-car-side",
      title: "Limitez les déplacements",
      content: "Réduisez vos déplacements en voiture et privilégiez le télétravail si possible pour limiter votre exposition.",
      priority: 'high',
      aqiRange: 'unhealthy'
    },

    // Conseils UNIVERSELS (tous niveaux)
    {
      icon: "fas fa-leaf",
      title: "Plantes dépolluantes",
      content: "Ajoutez des plantes comme le lierre, le ficus ou la sansevieria pour purifier naturellement l'air intérieur.",
      priority: 'normal',
      aqiRange: 'all'
    },
    {
      icon: "fas fa-bus",
      title: "Transport éco-responsable",
      content: "Privilégiez les transports en commun, le vélo ou la marche pour réduire collectivement la pollution.",
      priority: 'normal',
      aqiRange: 'all'
    },
    {
      icon: "fas fa-calendar-check",
      title: "Surveillance quotidienne",
      content: "Consultez régulièrement les prévisions de qualité de l'air pour adapter vos activités quotidiennes.",
      priority: 'normal',
      aqiRange: 'all'
    },
    {
      icon: "fas fa-water",
      title: "Hydratation importante",
      content: "Buvez beaucoup d'eau pour aider votre corps à éliminer les particules inhalées et rester hydraté.",
      priority: 'normal',
      aqiRange: 'all'
    },
    {
      icon: "fas fa-apple-alt",
      title: "Alimentation antioxydante",
      content: "Consommez des fruits et légumes riches en antioxydants (agrumes, baies, légumes verts) pour renforcer vos défenses.",
      priority: 'normal',
      aqiRange: 'all'
    },
    {
      icon: "fas fa-smoking-ban",
      title: "Évitez les irritants",
      content: "Ne fumez pas et évitez l'encens, les bougies parfumées et les produits chimiques ménagers agressifs.",
      priority: 'normal',
      aqiRange: 'all'
    },
    {
      icon: "fas fa-tree",
      title: "Soutenez les espaces verts",
      content: "Les arbres et espaces verts filtrent l'air. Soutenez les initiatives de plantation dans votre ville.",
      priority: 'normal',
      aqiRange: 'all'
    },
    {
      icon: "fas fa-thermometer-half",
      title: "Climatisation et filtration",
      content: "Si vous utilisez la climatisation, assurez-vous que les filtres sont propres et changez-les régulièrement.",
      priority: 'normal',
      aqiRange: 'all'
    }
  ];

  public displayedHealthTips: HealthTip[] = [];
  public isLoading = true;
  public carouselId = 'healthCarousel';
  // ✅ Index de la diapositive active pour synchroniser les points indicateurs
  public currentIndex = 0;
  private sensorSubscription?: Subscription;

  constructor(
    private sensorService: SensorService,
    private currentSensorService: CurrentSensorService,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    // ✅ S'abonner aux changements de capteur
    this.sensorSubscription = this.currentSensorService.currentSensor$.subscribe(
      sensor => {
        if (sensor && sensor.id) {
          console.log('💊 Health Tips - Nouveau capteur reçu:', sensor);
          this.loadHealthTips(sensor.id);
        } else {
          // ✅ Si pas de capteur, afficher des conseils génériques
          console.log('⏳ Health Tips - En attente de capteur, conseils génériques');
          this.filterAndSortTips(50); // AQI neutre par défaut
          this.isLoading = false;
          this.attachCarouselListener();
        }
      }
    );

    // ✅ Vérifier si un capteur est déjà disponible au démarrage
    const currentSensor = this.currentSensorService.getCurrentSensor();
    if (currentSensor && currentSensor.id) {
      console.log('✅ Health Tips - Capteur disponible au démarrage:', currentSensor);
      this.loadHealthTips(currentSensor.id);
    } else {
      // ✅ Pas de capteur au démarrage - afficher conseils génériques
      console.log('⏳ Health Tips - Aucun capteur, affichage conseils génériques');
      this.filterAndSortTips(50);
      this.isLoading = false;
      this.attachCarouselListener();
    }
  }

  loadHealthTips(sensorId: string): void {
    // ✅ Validation du sensorId
    if (!sensorId || sensorId.trim() === '') {
      console.warn('⚠️ Health Tips - SensorId invalide');
      this.filterAndSortTips(50);
      this.isLoading = false;
      this.attachCarouselListener();
      return;
    }

    this.isLoading = true;

    this.sensorService.getLatestSensorData(sensorId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const currentAqi = response.data.airQualityIndex;
          console.log(`💊 Health Tips - AQI: ${currentAqi}`);
          this.filterAndSortTips(currentAqi);
        } else {
          console.warn('⚠️ Health Tips - Pas de données, conseils génériques');
          this.filterAndSortTips(50);
        }
        this.isLoading = false;
        this.attachCarouselListener();
      },
      error: (err) => {
        console.error('❌ Health Tips - Erreur chargement:', err);
        this.filterAndSortTips(50);
        this.isLoading = false;
        this.attachCarouselListener();
      }
    });
  }

  // ✅ Attache l'écouteur Bootstrap pour synchroniser l'index actif des points
  private attachCarouselListener(): void {
    setTimeout(() => {
      const carouselEl = document.getElementById(this.carouselId);
      if (carouselEl) {
        carouselEl.addEventListener('slid.bs.carousel', (event: any) => {
          // ✅ NgZone.run() force la détection de changements Angular
          // car l'événement Bootstrap est déclenché hors de la zone Angular
          this.zone.run(() => {
            this.currentIndex = event.to;
          });
        });
      }
    }, 100);
  }

  // ✅ NOUVELLE MÉTHODE : Filtre selon AQI puis trie
  filterAndSortTips(aqi: number): void {
    // ✅ Réinitialiser l'index au changement de liste de conseils
    this.currentIndex = 0;
    // ✅ Validation de l'AQI
    if (aqi === null || aqi === undefined || isNaN(aqi)) {
      console.warn('⚠️ Health Tips - AQI invalide, utilisation valeur par défaut');
      aqi = 50;
    }

    // Déterminer la catégorie AQI
    let aqiCategory: 'good' | 'moderate' | 'unhealthy';
    if (aqi <= 50) {
      aqiCategory = 'good';
    } else if (aqi <= 100) {
      aqiCategory = 'moderate';
    } else {
      aqiCategory = 'unhealthy';
    }

    console.log(`💊 Filtrage conseils pour catégorie: ${aqiCategory} (AQI: ${aqi})`);

    // Filtrer les conseils pertinents
    let relevantTips = this.allHealthTips.filter(tip =>
      tip.aqiRange === 'all' || tip.aqiRange === aqiCategory
    );

    // Trier par pertinence
    this.displayedHealthTips = relevantTips.sort((a, b) => {
      return this.getTipScore(b, aqi) - this.getTipScore(a, aqi);
    });

    // Limiter à 6 conseils maximum pour le carrousel
    this.displayedHealthTips = this.displayedHealthTips.slice(0, 6);

    console.log(`💊 ${this.displayedHealthTips.length} conseils affichés`);
  }

  getTipScore(tip: HealthTip, aqi: number): number {
    const priority = tip.priority || 'normal';

    if (aqi > 100) {
      // Air mauvais - privilégier conseils haute priorité
      if (priority === 'high') return 10;
      if (priority === 'normal') return 5;
      return 1;
    } else if (aqi > 50) {
      // Air modéré - équilibrer les conseils
      if (priority === 'normal') return 10;
      if (priority === 'high') return 5;
      return 8;
    } else {
      // Air bon - privilégier conseils basse priorité
      if (priority === 'low') return 10;
      if (priority === 'normal') return 5;
      return 1;
    }
  }

  ngOnDestroy(): void {
    if (this.sensorSubscription) {
      this.sensorSubscription.unsubscribe();
    }
  }
}
