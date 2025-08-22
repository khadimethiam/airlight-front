import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces pour typer les données
export interface Sensor {
  id: string;
  name: string;
  city: string;
  // --- AJOUTEZ CES PROPRIÉTÉS OPTIONNELLES ---
  coordinates?: {
    lat: number;
    lng: number;
  };
  airQualityIndex?: number;
  // ------------------------------------------
}

export interface SensorData {
  // Définissez la structure des données d'un capteur ici
  _id: string;
  sensorId: string;
  measurements: {
    pm25: number;
    pm10: number;
    co2: number;
    temperature: number;
    humidity: number;
  };
  airQualityIndex: number;
  timestamp: string;
}

export interface SensorDataResponse {
  success: boolean;
  data: SensorData[];
  stats: any;
  pagination: any;
}

@Injectable({
  providedIn: 'root'
} )
export class SensorService {
  private apiUrl = 'http://localhost:3000/sensors'; // Assurez-vous que l'URL est correcte

  constructor(private http: HttpClient ) { }

  // Récupère la liste de tous les capteurs
  getSensors(): Observable<{ success: boolean, data: Sensor[] }> {
    return this.http.get<{ success: boolean, data: Sensor[] }>(`${this.apiUrl}` );
  }

  // Récupère les données pour un capteur spécifique et une période donnée
  getSensorData(sensorId: string, period: string = '24h'): Observable<SensorDataResponse> {
    const params = new HttpParams().set('period', period);
    return this.http.get<SensorDataResponse>(`${this.apiUrl}/${sensorId}/data`, { params } );
  }
  
  // Récupère la dernière mesure pour un capteur
  getLatestSensorData(sensorId: string): Observable<{ success: boolean, data: SensorData }> {
    return this.http.get<{ success: boolean, data: SensorData }>(`${this.apiUrl}/${sensorId}/latest` );
  }
}
