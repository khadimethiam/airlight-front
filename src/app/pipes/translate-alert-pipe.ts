// src/app/pipes/translate-alert.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'translateAlert',
  standalone: true
})
export class TranslateAlertPipe implements PipeTransform {

  private translations: { [key: string]: { [key: string]: string } } = {
    // Capteurs météo
    sensorId: {
      'WEATHER_RUFISQUE': 'Météo Rufisque',
      'WEATHER_RICHARD-TOLL': 'Météo Richard-Toll',
      'WEATHER_THIÈS': 'Météo Thiès',
      'WEATHER_THIES': 'Météo Thiès',
      'WEATHER_DAKAR': 'Météo Dakar',
      'WEATHER_SAINT-LOUIS': 'Météo Saint-Louis',
      'WEATHER_DIOURBEL': 'Météo Diourbel',
      'WEATHER_ZIGUINCHOR': 'Météo Ziguinchor',
      'WEATHER_BIGNONA': 'Météo Bignona',
      'WEATHER_PIKINE': 'Météo Pikine',
      'WEATHER_KEUR_MASSAR': 'Météo Keur Massar',
      'WEATHER_KEUR-MASSAR': 'Météo Keur Massar'
    },
    
    // Sévérités
    severity: {
      'good': 'Bon',
      'moderate': 'Modéré',
      'poor': 'Mauvais',
      'unhealthy': 'Malsain',
      'hazardous': 'Dangereux'
    },
    
    // États
    status: {
      'true': 'Active',
      'false': 'Résolue',
      'Active': 'Active',
      'active': 'Active',
      'Resolved': 'Résolue',
      'resolved': 'Résolue',
      'Acknowledged': 'Acquittée',
      'acknowledged': 'Acquittée'
    },
    
    // Localisations
    location: {
      'Inconnu': 'Position non disponible',
      'Unknown': 'Position non disponible',
      'inconnu': 'Position non disponible'
    }
  };

  transform(value: any, type: 'severity' | 'status' | 'sensorId' | 'location' = 'severity'): string {
    if (!value && value !== false) return value;
    
    // Convertir boolean en string pour status
    if (type === 'status' && typeof value === 'boolean') {
      value = value.toString();
    }
    
    return this.translations[type]?.[value] || value;
  }
}