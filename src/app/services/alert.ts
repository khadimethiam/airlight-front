import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interface pour une alerte
export interface Alert {
  _id: string;
  sensorId: string;
  alertType: string;
  severity: 'good' | 'moderate' | 'poor' | 'unhealthy' | 'hazardous';
  message: string;
  isActive: boolean;
  createdAt: string;
  qualityLevel?: string;
  referenceStandard?: string;
  data?: any;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
}

// Interface pour la réponse de l'API
export interface AlertsResponse {
  success: boolean;
  data: Alert[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Interface pour les statistiques
export interface AlertStatsResponse {
  success: boolean;
  period: string;
  data: {
    summary: {
      total: number;
      active: number;
      hazardous: number;
      unhealthy: number;
      poor: number;
      moderate: number;
      good: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    byQuality: any[];
    byType: any[];
    bySensor: any[];
    healthImpact: any[];
    healthIndicators: {
      globalRisk: string;
      criticalAlertsRatio: string;
      activeHealthAlerts: number;
      recommendation: string;
    };
  };
  standards: {
    reference: string;
    pm25Thresholds: string;
    pm10Thresholds: string;
    lastUpdate: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  // ✅ CHANGEMENT : environment.apiUrl au lieu de localhost
  private apiUrl = `${environment.apiUrl}/alerts`;

  constructor(private http: HttpClient) { }

  // ========================================
  // HELPER METHODS
  // ========================================

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (token) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
    }

    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  private isAuthenticated(): boolean {
    return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  }

  // ========================================
  // PUBLIC METHODS - ROUTES SANS AUTH
  // ========================================

  getAlerts(filters: any = {}): Observable<AlertsResponse> {
    let params = new HttpParams();
    for (const key in filters) {
      if (filters[key]) {
        params = params.set(key, filters[key]);
      }
    }
    return this.http.get<AlertsResponse>(this.apiUrl, { params });
  }

  getActiveAlerts(sensorId?: string): Observable<any> {
    let params = new HttpParams();
    if (sensorId) {
      params = params.set('sensorId', sensorId);
    }
    return this.http.get<any>(`${this.apiUrl}/active`, { params });
  }

  getAlertById(alertId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${alertId}`);
  }

  getAlertHistory(sensorId: string, filters: any = {}): Observable<any> {
    let params = new HttpParams();
    for (const key in filters) {
      if (filters[key]) {
        params = params.set(key, filters[key]);
      }
    }
    return this.http.get<any>(`${this.apiUrl}/history/${sensorId}`, { params });
  }

  getHealthRecommendations(pollutant: string, value: number): Observable<any> {
    const params = new HttpParams()
      .set('pollutant', pollutant)
      .set('value', value.toString());

    return this.http.get<any>(`${this.apiUrl}/health-recommendations`, { params });
  }

  getHealthDashboard(period: string = '1h'): Observable<any> {
    const params = new HttpParams().set('period', period);
    return this.http.get<any>(`${this.apiUrl}/dashboard/health`, { params });
  }

  getQuickStats(hours: number = 24): Observable<any> {
    const params = new HttpParams().set('hours', hours.toString());
    return this.http.get<any>(`${this.apiUrl}/stats/quick`, { params });
  }

  // ========================================
  // PROTECTED METHODS - ROUTES AVEC AUTH
  // ========================================

  getAlertStats(period: string = '7d'): Observable<AlertStatsResponse> {
    const params = new HttpParams().set('period', period);
    const headers = this.getAuthHeaders();

    return this.http.get<AlertStatsResponse>(
      `${this.apiUrl}/stats`,
      { params, headers }
    );
  }

  acknowledgeAlert(alertId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch(
      `${this.apiUrl}/${alertId}/acknowledge`,
      {},
      { headers }
    );
  }

  resolveAlert(alertId: string, resolution?: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const body = resolution ? { resolution } : {};

    return this.http.patch(
      `${this.apiUrl}/${alertId}/resolve`,
      body,
      { headers }
    );
  }

  bulkAcknowledge(alertIds: string[]): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(
      `${this.apiUrl}/bulk/acknowledge`,
      { alertIds },
      { headers }
    );
  }

  bulkResolve(alertIds: string[], resolution?: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const body: any = { alertIds };
    if (resolution) {
      body.resolution = resolution;
    }

    return this.http.post(
      `${this.apiUrl}/bulk/resolve`,
      body,
      { headers }
    );
  }

  checkAlerts(sensorData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(
      `${this.apiUrl}/check`,
      sensorData,
      { headers }
    );
  }

  getThresholds(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(
      `${this.apiUrl}/thresholds`,
      { headers }
    );
  }

  // ========================================
  // ADMIN METHODS - ROUTES ADMIN SEULEMENT
  // ========================================

  updateThresholds(thresholds: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(
      `${this.apiUrl}/thresholds`,
      thresholds,
      { headers }
    );
  }

  validateThresholds(thresholds: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(
      `${this.apiUrl}/validate-thresholds`,
      thresholds,
      { headers }
    );
  }

  createManualAlert(alertData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(
      `${this.apiUrl}/manual`,
      alertData,
      { headers }
    );
  }

  cleanupOldAlerts(daysOld: number = 30): Observable<any> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('daysOld', daysOld.toString());

    return this.http.delete(
      `${this.apiUrl}/cleanup`,
      { headers, params }
    );
  }

  testAlert(testType: string = 'basic', sensorId?: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const body: any = { testType };
    if (sensorId) {
      body.sensorId = sensorId;
    }

    return this.http.post(
      `${this.apiUrl}/test`,
      body,
      { headers }
    );
  }

  compareStandards(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(
      `${this.apiUrl}/test/compare-standards`,
      { headers }
    );
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  getAirQualityReport(sensorId: string, hours: number = 24): Observable<any> {
    const params = new HttpParams().set('hours', hours.toString());
    return this.http.get<any>(
      `${this.apiUrl}/report/${sensorId}`,
      { params }
    );
  }

  formatAlertDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR');
  }

  getSeverityColor(severity: string): string {
    const colors: { [key: string]: string } = {
      'good': '#10b981',
      'moderate': '#3b82f6',
      'poor': '#f59e0b',
      'unhealthy': '#ef4444',
      'hazardous': '#dc2626'
    };
    return colors[severity] || '#6b7280';
  }

  getSeverityIcon(severity: string): string {
    const icons: { [key: string]: string } = {
      'good': '🟢',
      'moderate': '🔵',
      'poor': '🟡',
      'unhealthy': '🟠',
      'hazardous': '🔴'
    };
    return icons[severity] || '⚪';
  }

  getSeverityLabel(severity: string): string {
    const labels: { [key: string]: string } = {
      'good': 'Bon',
      'moderate': 'Modéré',
      'poor': 'Mauvais',
      'unhealthy': 'Malsain',
      'hazardous': 'Dangereux'
    };
    return labels[severity] || severity;
  }
}