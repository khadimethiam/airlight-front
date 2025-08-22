// src/app/components/health-tips/health-tips.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SensorService } from '../../services/sensor';

// Interface pour structurer nos conseils
interface HealthTip {
  icon: string;
  title: string;
  content: string;
  priority?: 'high' | 'low' | 'normal';
}

@Component({
  selector: 'app-health-tips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './health-tips.html',
  styleUrls: ['./health-tips.css']
})
export class HealthTips implements OnInit {

  // La liste de tous les conseils possibles
  private allHealthTips: HealthTip[] = [
    {
      icon: "fas fa-running",
      title: "Activité physique",
      content: "L'air est bon ! C'est le moment idéal pour profiter des activités extérieures et faire du sport.",
      priority: 'low'
    },
    {
      icon: "fas fa-home",
      title: "Purifiez votre intérieur",
      content: "Utilisez des purificateurs d'air avec filtres HEPA et aérez votre logement pendant les heures de faible pollution.",
      priority: 'high'
    },
    {
      icon: "fas fa-mask",
      title: "Protection personnelle",
      content: "Portez un masque N95 ou FFP2 lors des pics de pollution, surtout si vous souffrez d'asthme ou de problèmes respiratoires.",
      priority: 'high'
    },
    {
      icon: "fas fa-leaf",
      title: "Plantes dépolluantes",
      content: "Intégrez des plantes comme le lierre, le ficus ou la sansevieria dans votre intérieur pour améliorer la qualité de l'air.",
      priority: 'normal'
    },
    {
      icon: "fas fa-car",
      title: "Transport éco-responsable",
      content: "Privilégiez les transports en commun, le vélo ou la marche. Si vous devez conduire, évitez les heures de pointe.",
      priority: 'normal'
    },
    {
      icon: "fas fa-calendar-check",
      title: "Surveillance quotidienne",
      content: "Consultez régulièrement les prévisions de qualité de l'air pour planifier vos activités et protéger votre santé.",
      priority: 'normal'
    }
  ];

  // La liste qui sera réellement utilisée par le template.
  // On l'initialise avec la liste par défaut pour éviter un écran vide.
  public displayedHealthTips: HealthTip[] = this.allHealthTips;
  public isLoading = true;

  constructor(private sensorService: SensorService) {}

  ngOnInit(): void {
    this.isLoading = true;
    // 1. Récupérer l'AQI du capteur principal
    this.sensorService.getLatestSensorData('d83bdad43d8').subscribe({
      next: (response) => {
        const currentAqi = response.success ? response.data.airQualityIndex : 50;
        this.sortTips(currentAqi);
        this.isLoading = false;
      },
      error: () => {
        // En cas d'erreur, on garde les conseils par défaut
        this.sortTips(50);
        this.isLoading = false;
      }
    });
  }

  // 2. Trie les conseils et met à jour la variable affichée
  sortTips(aqi: number): void {
    this.displayedHealthTips = [...this.allHealthTips].sort((a, b) => {
      return this.getTipScore(b, aqi) - this.getTipScore(a, aqi);
    });
  }

  // 3. Logique pour donner un score de pertinence à chaque conseil
  getTipScore(tip: HealthTip, aqi: number): number {
    const priority = tip.priority || 'normal';
    
    if (aqi > 100) { // Si l'air est mauvais
      if (priority === 'high') return 10;
      if (priority === 'normal') return 5;
      return 1; // 'low' a la plus basse priorité
    } else { // Si l'air est bon ou modéré
      if (priority === 'low') return 10;
      if (priority === 'normal') return 5;
      return 1; // 'high' a la plus basse priorité
    }
  }
}
