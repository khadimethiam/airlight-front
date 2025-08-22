// src/app/services/weather.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interface pour la réponse de la météo actuelle
export interface WeatherResponse {
  success: boolean;
  data: {
    location: {
      name: string;
      country: string;
    };
    current: {
      timestamp: string;
      temperature: number;
      feels_like: number;
      humidity: number;
      pressure: number;
      weather: {
        main: string;
        description: string;
        icon: string;
        iconUrl: string; // Nous allons l'ajouter
      };
      wind: {
        speed_kmh: number;
      };
    };
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
} )
export class WeatherService {
  private apiUrl = 'http://localhost:3000/weather'; // L'URL de base de votre API météo

  constructor(private http: HttpClient ) { }

  /**
   * Récupère la météo actuelle pour une ville ou des coordonnées.
   * @param city Le nom de la ville (ex: 'Dakar')
   * @param lat Latitude
   * @param lon Longitude
   */
  getCurrentWeather(city?: string, lat?: number, lon?: number): Observable<WeatherResponse> {
    let params = new HttpParams();
    if (city) {
      params = params.set('city', city);
    }
    if (lat && lon) {
      params = params.set('lat', lat.toString()).set('lon', lon.toString());
    }

    return this.http.get<WeatherResponse>(`${this.apiUrl}/current`, { params } ).pipe(
      catchError(this.handleError<WeatherResponse>('getCurrentWeather'))
    );
  }

  /**
   * Gère les erreurs des appels HTTP et retourne un résultat sûr.
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} a échoué : ${error.message}`);
      // Retourne un résultat vide pour que l'application ne plante pas.
      return of(result as T);
    };
  }
}
