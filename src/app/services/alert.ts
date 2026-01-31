// src/app/services/alert.service.ts - VERSION COMPLÈTE AVEC AUTHENTIFICATION

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
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
  private apiUrl = 'http://localhost:3000/alerts';

  constructor(private http: HttpClient) { }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Obtenir les headers avec token JWT
   */
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

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  private isAuthenticated(): boolean {
    return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  }

  // ========================================
  // PUBLIC METHODS - ROUTES SANS AUTH
  // ========================================

  /**
   * Récupère les alertes avec des filtres optionnels
   * Route publique (sans authentification)
   */
  getAlerts(filters: any = {}): Observable<AlertsResponse> {
    let params = new HttpParams();
    for (const key in filters) {
      if (filters[key]) {
        params = params.set(key, filters[key]);
      }
    }
    return this.http.get<AlertsResponse>(this.apiUrl, { params });
  }

  /**
   * Récupère les alertes actives pour un capteur
   * Route publique
   */
  getActiveAlerts(sensorId?: string): Observable<any> {
    let params = new HttpParams();
    if (sensorId) {
      params = params.set('sensorId', sensorId);
    }
    return this.http.get<any>(`${this.apiUrl}/active`, { params });
  }

  /**
   * Récupère une alerte par ID
   * Route publique
   */
  getAlertById(alertId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${alertId}`);
  }

  /**
   * Récupère l'historique des alertes pour un capteur
   * Route publique
   */
  getAlertHistory(sensorId: string, filters: any = {}): Observable<any> {
    let params = new HttpParams();
    for (const key in filters) {
      if (filters[key]) {
        params = params.set(key, filters[key]);
      }
    }
    return this.http.get<any>(`${this.apiUrl}/history/${sensorId}`, { params });
  }

  /**
   * Récupère les recommandations santé
   * Route publique
   */
  getHealthRecommendations(pollutant: string, value: number): Observable<any> {
    const params = new HttpParams()
      .set('pollutant', pollutant)
      .set('value', value.toString());

    return this.http.get<any>(`${this.apiUrl}/health-recommendations`, { params });
  }

  /**
   * Récupère le dashboard santé temps réel
   * Route publique
   */
  getHealthDashboard(period: string = '1h'): Observable<any> {
    const params = new HttpParams().set('period', period);
    return this.http.get<any>(`${this.apiUrl}/dashboard/health`, { params });
  }

  /**
   * Récupère les statistiques rapides
   * Route publique
   */
  getQuickStats(hours: number = 24): Observable<any> {
    const params = new HttpParams().set('hours', hours.toString());
    return this.http.get<any>(`${this.apiUrl}/stats/quick`, { params });
  }

  // ========================================
  // PROTECTED METHODS - ROUTES AVEC AUTH
  // ========================================

  /**
   * Récupère les statistiques des alertes
   * ⚠️ REQUIERT AUTHENTIFICATION
   */
  getAlertStats(period: string = '7d'): Observable<AlertStatsResponse> {
    const params = new HttpParams().set('period', period);
    const headers = this.getAuthHeaders();

    return this.http.get<AlertStatsResponse>(
      `${this.apiUrl}/stats`,
      { params, headers }
    );
  }

  /**
   * Acquitte une alerte
   * ⚠️ REQUIERT AUTHENTIFICATION
   */
  acknowledgeAlert(alertId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch(
      `${this.apiUrl}/${alertId}/acknowledge`,
      {},
      { headers }
    );
  }

  /**
   * Résout une alerte
   * ⚠️ REQUIERT AUTHENTIFICATION
   */
  resolveAlert(alertId: string, resolution?: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const body = resolution ? { resolution } : {};

    return this.http.patch(
      `${this.apiUrl}/${alertId}/resolve`,
      body,
      { headers }
    );
  }

  /**
   * Acquitte plusieurs alertes en une fois
   * ⚠️ REQUIERT AUTHENTIFICATION
   */
  bulkAcknowledge(alertIds: string[]): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(
      `${this.apiUrl}/bulk/acknowledge`,
      { alertIds },
      { headers }
    );
  }

  /**
   * Résout plusieurs alertes en une fois
   * ⚠️ REQUIERT AUTHENTIFICATION
   */
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

  /**
   * Vérifie et crée des alertes pour des données de capteur
   * ⚠️ REQUIERT AUTHENTIFICATION
   */
  checkAlerts(sensorData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(
      `${this.apiUrl}/check`,
      sensorData,
      { headers }
    );
  }

  /**
   * Récupère les seuils d'alerte
   * ⚠️ REQUIERT AUTHENTIFICATION
   */
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

  /**
   * Met à jour les seuils d'alerte
   * ⚠️ REQUIERT ADMIN
   */
  updateThresholds(thresholds: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(
      `${this.apiUrl}/thresholds`,
      thresholds,
      { headers }
    );
  }

  /**
   * Valide des seuils avant application
   * ⚠️ REQUIERT ADMIN
   */
  validateThresholds(thresholds: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(
      `${this.apiUrl}/validate-thresholds`,
      thresholds,
      { headers }
    );
  }

  /**
   * Crée une alerte manuellement
   * ⚠️ REQUIERT ADMIN
   */
  createManualAlert(alertData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(
      `${this.apiUrl}/manual`,
      alertData,
      { headers }
    );
  }

  /**
   * Nettoie les anciennes alertes
   * ⚠️ REQUIERT ADMIN
   */
  cleanupOldAlerts(daysOld: number = 30): Observable<any> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('daysOld', daysOld.toString());

    return this.http.delete(
      `${this.apiUrl}/cleanup`,
      { headers, params }
    );
  }

  /**
   * Test d'alerte (environnement développement seulement)
   * ⚠️ REQUIERT ADMIN
   */
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

  /**
   * Compare les anciens et nouveaux standards
   * ⚠️ REQUIERT ADMIN
   */
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

  /**
   * Obtient le rapport de qualité de l'air pour un capteur
   */
  getAirQualityReport(sensorId: string, hours: number = 24): Observable<any> {
    const params = new HttpParams().set('hours', hours.toString());
    return this.http.get<any>(
      `${this.apiUrl}/report/${sensorId}`,
      { params }
    );
  }

  /**
   * Formatte une date d'alerte pour l'affichage
   */
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

  /**
   * Obtient la couleur selon la sévérité
   */
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

  /**
   * Obtient l'icône selon la sévérité
   */
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

  /**
   * Obtient le label en français selon la sévérité
   */
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
