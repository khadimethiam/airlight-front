import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// Interface pour une prédiction
export interface Prediction {
  _id: string;
  sensorId: string;
  predictedPM25: number;
  predictedAQI: number;
  predictionFor: string;
  confidence: number;
  modelVersion: string;
  createdAt?: string; // ✅ AJOUTÉ
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
})
export class PredictionService {
  private apiUrl = 'http://localhost:3000/predictions';

  constructor(private http: HttpClient) { }

  // ✅ Récupère les prédictions futures avec gestion d'erreur
  getFuturePredictions(sensorId: string, hours: number = 168): Observable<PredictionsResponse> {
    const params = new HttpParams()
      .set('type', 'future')
      .set('hours', hours.toString());

    console.log(`📡 API Call: GET ${this.apiUrl}/${sensorId}?type=future&hours=${hours}`);

    return this.http.get<PredictionsResponse>(`${this.apiUrl}/${sensorId}`, { params }).pipe(
      tap(response => console.log('✅ Future predictions received:', response)),
      catchError(error => this.handleError('getFuturePredictions', error))
    );
  }

  // ✅ Récupère les prédictions récentes avec gestion d'erreur
  getRecentPredictions(sensorId: string, limit: number = 24): Observable<PredictionsResponse> {
    const params = new HttpParams()
      .set('type', 'recent')
      .set('limit', limit.toString());

    console.log(`📡 API Call: GET ${this.apiUrl}/${sensorId}?type=recent&limit=${limit}`);

    return this.http.get<PredictionsResponse>(`${this.apiUrl}/${sensorId}`, { params }).pipe(
      tap(response => console.log('✅ Recent predictions received:', response)),
      catchError(error => this.handleError('getRecentPredictions', error))
    );
  }

  // ✅ Récupère la précision du modèle avec gestion d'erreur
  getAccuracy(sensorId: string): Observable<any> {
    console.log(`📡 API Call: GET ${this.apiUrl}/${sensorId}/accuracy`);

    return this.http.get<any>(`${this.apiUrl}/${sensorId}/accuracy`).pipe(
      tap(response => console.log('✅ Accuracy received:', response)),
      catchError(error => this.handleError('getAccuracy', error))
    );
  }

  // 🆕 Générer de nouvelles prédictions
  generatePredictions(sensorId: string, hoursAhead: number = 168): Observable<any> {
    console.log(`📡 API Call: POST ${this.apiUrl}/${sensorId}/generate (${hoursAhead}h)`);

    return this.http.post<any>(`${this.apiUrl}/${sensorId}/generate`, {
      hoursAhead: hoursAhead
    }).pipe(
      tap(response => console.log('✅ Predictions generated:', response)),
      catchError(error => this.handleError('generatePredictions', error))
    );
  }

  // ✅ Gestion centralisée des erreurs
  private handleError(operation: string, error: HttpErrorResponse): Observable<PredictionsResponse> {
    console.error(`❌ Error in ${operation}:`, error);

    // Cas d'erreur réseau ou serveur
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      console.error('Client-side error:', error.error.message);
    } else {
      // Erreur côté serveur
      console.error(`Server returned code ${error.status}, body:`, error.error);
    }

    // Retourner une réponse vide mais valide pour ne pas casser l'interface
    return of({
      success: false,
      data: [],
      count: 0,
      accuracy: null
    });
  }
}