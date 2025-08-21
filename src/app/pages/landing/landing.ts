import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importation de TOUS les composants que nous avons créés
import { Header } from '../../components/header/header';
import { Hero } from '../../components/hero/hero';
import { Weather } from '../../components/weather/weather';
import { AirQuality } from '../../components/air-quality/air-quality';
import { HealthTips } from '../../components/health-tips/health-tips';
import { Cta } from '../../components/cta/cta';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-landing',
  standalone: true,
  // On déclare tous les composants importés pour pouvoir les utiliser dans le template HTML
  imports: [
    CommonModule,
    Header,
    Hero,
    Weather,
    AirQuality,
    HealthTips,
    Cta,
    Footer
  ],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css']
})
export class Landing {

}
