import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
  latitude?: number;
  longitude?: number;
  airQualityIndex?: number;
  status?: string;
  isOnline?: boolean;
  distance?: number;
  lastUpdate?: string;
  locationId?: number;
  serialNo?: string;
  type?: string;
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
  // ✅ CHANGEMENT : environment.apiUrl au lieu de localhost
  private apiUrl = `${environment.apiUrl}/sensors`;

  constructor(private http: HttpClient) { }

  getSensors(): Observable<{ success: boolean, data: Sensor[] }> {
    return this.http.get<{ success: boolean, data: Sensor[] }>(`${this.apiUrl}`);
  }

  getSensorData(sensorId: string, period: string = '24h'): Observable<SensorDataResponse> {
    const params = new HttpParams().set('period', period);
    return this.http.get<SensorDataResponse>(`${this.apiUrl}/${sensorId}/data`, { params });
  }

  getLatestSensorData(sensorId: string): Observable<{ success: boolean, data: SensorData }> {
    return this.http.get<{ success: boolean, data: SensorData }>(`${this.apiUrl}/${sensorId}/latest`);
  }

  getNearestSensor(latitude: number, longitude: number): Observable<NearestSensorResponse> {
    const params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString());

    return this.http.get<NearestSensorResponse>(`${this.apiUrl}/nearest`, { params });
  }
}