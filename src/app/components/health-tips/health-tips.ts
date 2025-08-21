import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Interface pour structurer nos conseils
interface HealthTip {
  icon: string;
  title: string;
  content: string;
}

@Component({
  selector: 'app-health-tips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './health-tips.html',
  styleUrls: ['./health-tips.css']
})
export class HealthTips {

  // Tableau contenant tous les conseils santé
  healthTips: HealthTip[] = [
    {
      icon: "fas fa-running",
      title: "Activité physique et pollution",
      content: "Évitez les exercices intensifs à l'extérieur lorsque l'indice de qualité de l'air est élevé. Privilégiez les activités en intérieur ou tôt le matin."
    },
    {
      icon: "fas fa-home",
      title: "Purifiez votre intérieur",
      content: "Utilisez des purificateurs d'air avec filtres HEPA et aérez votre logement pendant les heures de faible pollution (généralement tôt le matin)."
    },
    {
      icon: "fas fa-mask",
      title: "Protection personnelle",
      content: "Portez un masque N95 ou FFP2 lors des pics de pollution, surtout si vous souffrez d'asthme ou de problèmes respiratoires."
    },
    {
      icon: "fas fa-leaf",
      title: "Plantes dépolluantes",
      content: "Intégrez des plantes comme le lierre, le ficus ou la sansevieria dans votre intérieur pour améliorer naturellement la qualité de l'air."
    },
    {
      icon: "fas fa-car",
      title: "Transport éco-responsable",
      content: "Privilégiez les transports en commun, le vélo ou la marche. Si vous devez conduire, évitez les heures de pointe."
    },
    {
      icon: "fas fa-calendar-check",
      title: "Surveillance quotidienne",
      content: "Consultez régulièrement les prévisions de qualité de l'air pour planifier vos activités extérieures et protéger votre santé."
    }
  ];
}
