import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
} )
export class DashboardService {
  // L'URL de votre API d'administration
  private adminApiUrl = 'http://localhost:3000/admin';

  constructor(private http: HttpClient ) { }

  // Méthode pour récupérer les données de la vue d'ensemble
  getOverviewData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.adminApiUrl}/dashboard` );
  }
}
