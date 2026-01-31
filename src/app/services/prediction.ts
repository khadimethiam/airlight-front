import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Interface pour une prédiction
export interface Prediction {
  _id: string;
  sensorId: string;
  predictedPM25: number;
  predictedAQI: number;
  predictionFor: string;
  confidence: number;
  modelVersion: string;
  createdAt?: string;
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
  // ✅ CHANGEMENT : environment.apiUrl au lieu de localhost
  private apiUrl = `${environment.apiUrl}/predictions`;

  constructor(private http: HttpClient) { }

  getFuturePredictions(sensorId: string, hours: number = 168): Observable<PredictionsResponse> {
    const params = new HttpParams()
      .set('type', 'future')
      .set('hours', hours.toString());

    return this.http.get<PredictionsResponse>(`${this.apiUrl}/${sensorId}`, { params }).pipe(
      tap(response => console.log('✅ Future predictions received:', response)),
      catchError(error => this.handleError('getFuturePredictions', error))
    );
  }

  getRecentPredictions(sensorId: string, limit: number = 24): Observable<PredictionsResponse> {
    const params = new HttpParams()
      .set('type', 'recent')
      .set('limit', limit.toString());

    return this.http.get<PredictionsResponse>(`${this.apiUrl}/${sensorId}`, { params }).pipe(
      tap(response => console.log('✅ Recent predictions received:', response)),
      catchError(error => this.handleError('getRecentPredictions', error))
    );
  }

  getAccuracy(sensorId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${sensorId}/accuracy`).pipe(
      tap(response => console.log('✅ Accuracy received:', response)),
      catchError(error => this.handleError('getAccuracy', error))
    );
  }

  generatePredictions(sensorId: string, hoursAhead: number = 168): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${sensorId}/generate`, {
      hoursAhead: hoursAhead
    }).pipe(
      tap(response => console.log('✅ Predictions generated:', response)),
      catchError(error => this.handleError('generatePredictions', error))
    );
  }

  private handleError(operation: string, error: HttpErrorResponse): Observable<PredictionsResponse> {
    console.error(`❌ Error in ${operation}:`, error);

    if (error.error instanceof ErrorEvent) {
      console.error('Client-side error:', error.error.message);
    } else {
      console.error(`Server returned code ${error.status}, body:`, error.error);
    }

    return of({
      success: false,
      data: [],
      count: 0,
      accuracy: null
    });
  }
}