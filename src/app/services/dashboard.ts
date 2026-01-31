import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interface pour typer la réponse de l'API
export interface DashboardData {
  success: boolean;
  data: {
    overview: {
      users: number;
      alerts_24h: number;
      sensor_data_24h: number;
      total_alerts: number;
      active_sensors: number;
    };
    sensors: any[];
    alerts: {
      bySeverity: any[];
      recent: any[];
    };
    scheduler: any;
    websocket: any;
    system: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  // ✅ CHANGEMENT : environment.apiUrl au lieu de localhost
  private adminApiUrl = `${environment.apiUrl}/admin`;
  private sensorsApiUrl = `${environment.apiUrl}/sensors`;

  constructor(private http: HttpClient) { }

  getOverviewData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.adminApiUrl}/dashboard`);
  }

  getGlobalSensorStats(period: string = '24h'): Observable<any> {
    return this.http.get<any>(`${this.sensorsApiUrl}/stats/global?period=${period}`);
  }
}