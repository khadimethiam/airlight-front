// src/app/services/current-sensor.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Sensor } from './sensor';

@Injectable({
  providedIn: 'root'
})
export class CurrentSensorService {

  // ✅ BehaviorSubject initialisé avec null (pas de capteur par défaut)
  private currentSensorSubject = new BehaviorSubject<Sensor | null>(null);

  // Observable public pour que les composants puissent s'abonner
  public currentSensor$: Observable<Sensor | null> = this.currentSensorSubject.asObservable();

  constructor() {
    console.log('🔧 CurrentSensorService initialisé sans capteur par défaut');
  }

  /**
   * Met à jour le capteur actuel
   */
  setCurrentSensor(sensor: Sensor | null): void {
    console.log('🔄 Changement de capteur actuel:', sensor);
    this.currentSensorSubject.next(sensor);
  }

  /**
   * Récupère le capteur actuel (valeur instantanée)
   */
  getCurrentSensor(): Sensor | null {
    return this.currentSensorSubject.value;
  }

  /**
   * Récupère l'ID du capteur actuel
   */
  getCurrentSensorId(): string | null {
    return this.currentSensorSubject.value?.id || null;
  }

  /**
   * Vérifie si un capteur est actuellement défini
   */
  hasSensor(): boolean {
    return this.currentSensorSubject.value !== null;
  }
}
