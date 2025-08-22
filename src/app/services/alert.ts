import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface pour une alerte
export interface Alert {
  _id: string;
  sensorId: string;
  alertType: string;
  severity: 'good' | 'moderate' | 'poor' | 'unhealthy' | 'hazardous';
  message: string;
  isActive: boolean;
  createdAt: string;
  // ... autres champs potentiels
}

// Interface pour la réponse de l'API
export interface AlertsResponse {
  success: boolean;
  data: Alert[];
  pagination: any;
}

@Injectable({
  providedIn: 'root'
} )
export class AlertService {
  private apiUrl = 'http://localhost:3000/alerts';

  constructor(private http: HttpClient ) { }

  // Récupère les alertes avec des filtres optionnels
  getAlerts(filters: any = {}): Observable<AlertsResponse> {
    let params = new HttpParams();
    // Construit les paramètres de la requête à partir de l'objet de filtres
    for (const key in filters) {
      if (filters[key]) {
        params = params.set(key, filters[key]);
      }
    }
    return this.http.get<AlertsResponse>(this.apiUrl, { params } );
  }

  // Acquitte une alerte
  acknowledgeAlert(alertId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${alertId}/acknowledge`, {} );
  }

  // Résout une alerte
  resolveAlert(alertId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${alertId}/resolve`, {} );
  }
  
  // Récupère les statistiques des alertes
  getAlertStats(period: string = '7d'): Observable<any> {
    const params = new HttpParams().set('period', period);
    return this.http.get<any>(`${this.apiUrl}/stats`, { params } );
  }
}
