import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface pour une prédiction
export interface Prediction {
  _id: string;
  sensorId: string;
  predictedPM25: number;
  predictedAQI: number;
  predictionFor: string;
  confidence: number;
  modelVersion: string;
}

// Interface pour la réponse de l'API
export interface PredictionsResponse {
  success: boolean;
  data: Prediction[];
  accuracy?: any;
  count: number;
}

@Injectable({
  providedIn: 'root'
} )
export class PredictionService {
  private apiUrl = 'http://localhost:3000/predictions';

  constructor(private http: HttpClient ) { }

  // Récupère les prédictions futures pour un capteur
  getFuturePredictions(sensorId: string): Observable<PredictionsResponse> {
    return this.http.get<PredictionsResponse>(`${this.apiUrl}/${sensorId}?type=future` );
  }
  
  // Récupère les prédictions récentes (passées) pour un capteur
  getRecentPredictions(sensorId: string, limit: number = 24): Observable<PredictionsResponse> {
    const params = new HttpParams().set('type', 'recent').set('limit', limit.toString());
    return this.http.get<PredictionsResponse>(`${this.apiUrl}/${sensorId}`, { params } );
  }
  
  // Récupère les statistiques de performance du modèle
  getAccuracy(sensorId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${sensorId}/accuracy` );
  }
}
