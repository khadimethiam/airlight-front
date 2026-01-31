import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces pour typer les données
export interface Sensor {
  id: string;
  name: string;
  city: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  latitude?: number;          // ✅ AJOUTÉ - Coordonnées GPS
  longitude?: number;         // ✅ AJOUTÉ - Coordonnées GPS
  airQualityIndex?: number;
  status?: string;            // ✅ 'online' | 'offline'
  isOnline?: boolean;         // ✅ AJOUTÉ - Alternative booléenne
  distance?: number;          // ✅ Distance calculée (en km)
  lastUpdate?: string;        // ✅ Dernière mise à jour
  locationId?: number;        // ✅ AJOUTÉ - ID AirGradient
  serialNo?: string;          // ✅ AJOUTÉ - Numéro de série
  type?: string;              // ✅ AJOUTÉ - 'indoor' | 'outdoor'
}

export interface SensorData {
  _id: string;
  sensorId: string;
  measurements: {
    pm25: number;
    pm10: number;
    pm1?: number;
    co2: number;
    temperature: number;
    humidity: number;
    tvoc?: number;
    nox?: number;
  };
  airQualityIndex: number;
  qualityLevel?: string;
  timestamp: string;
  source?: string;
}

export interface SensorDataResponse {
  success: boolean;
  data: SensorData[];
  stats?: any;
  pagination?: any;
}

// ✅ Interface pour la réponse du capteur le plus proche
export interface NearestSensorResponse {
  success: boolean;
  nearest_sensor?: Sensor;
  alternatives?: Sensor[];
  total_online_sensors?: number;
  total_sensors?: number;
  user_location?: {
    latitude: number;
    longitude: number;
  };
  message?: string;
  nearest_offline?: Sensor;
  all_sensors_by_distance?: Sensor[];
}

@Injectable({
  providedIn: 'root'
})
export class SensorService {
  private apiUrl = 'http://localhost:3000/sensors';

  constructor(private http: HttpClient) { }

  /**
   * Récupère la liste de tous les capteurs
   */
  getSensors(): Observable<{ success: boolean, data: Sensor[] }> {
    return this.http.get<{ success: boolean, data: Sensor[] }>(`${this.apiUrl}`);
  }

  /**
   * Récupère les données pour un capteur spécifique et une période donnée
   */
  getSensorData(sensorId: string, period: string = '24h'): Observable<SensorDataResponse> {
    const params = new HttpParams().set('period', period);
    return this.http.get<SensorDataResponse>(`${this.apiUrl}/${sensorId}/data`, { params });
  }

  /**
   * Récupère la dernière mesure pour un capteur
   */
  getLatestSensorData(sensorId: string): Observable<{ success: boolean, data: SensorData }> {
    return this.http.get<{ success: boolean, data: SensorData }>(`${this.apiUrl}/${sensorId}/latest`);
  }

  /**
   * ✅ Trouver le capteur le plus proche de l'utilisateur
   */
  getNearestSensor(latitude: number, longitude: number): Observable<NearestSensorResponse> {
    const params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString());

    return this.http.get<NearestSensorResponse>(`${this.apiUrl}/nearest`, { params });
  }
}
