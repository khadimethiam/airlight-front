import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PollutantsInfo } from '../../components/pollutants-info/pollutants-info';
import { Header } from '../../components/header/header';
import { Hero } from '../../components/hero/hero';
import { CurrentStatus } from '../../components/current-status/current-status';
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
    CurrentStatus,
    AirQuality,
    HealthTips,
    Cta,
    Footer,
    PollutantsInfo
  ],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css']
})
export class Landing {

}
