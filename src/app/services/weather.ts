// src/app/services/weather.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Interface pour la réponse de la météo actuelle
export interface WeatherResponse {
  success: boolean;
  data: {
    location: {
      name: string;
      country: string;
      coordinates: {
        lat: number;
        lon: number;
      };
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
      };
      wind: {
        speed: number;
        speed_kmh: number;
        direction: number;
      };
    };
    airQualityImpact?: {
      overall: string;
      score: number;
      factors: string[];
    };
  };
  message: string;
}

// ✅ Interface pour les prévisions
export interface ForecastResponse {
  success: boolean;
  data: {
    location: {
      name: string;
      country: string;
    };
    daily: Array<{
      date: string;
      temperature: {
        min: number;
        max: number;
        avg: number;
      };
      humidity: {
        avg: number;
      };
      wind: {
        avg_speed: number;
        max_speed: number;
      };
      weather: string;
    }>;
  };
  message: string;
}

// ✅ Interface pour météo de toutes les villes
export interface CitiesWeatherResponse {
  success: boolean;
  data: Array<{
    city: string;
    success: boolean;
    data: WeatherResponse['data'] | null;
    error: string | null;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  // ✅ CHANGEMENT : utiliser environment.apiUrl au lieu de localhost
  private apiUrl = `${environment.apiUrl}/weather`;

  constructor(private http: HttpClient) { }

  /**
   * Récupère la météo actuelle pour une ville ou des coordonnées
   */
  getCurrentWeather(city?: string, lat?: number, lon?: number): Observable<WeatherResponse> {
    let params = new HttpParams();
    if (city) {
      params = params.set('city', city);
    }
    if (lat && lon) {
      params = params.set('lat', lat.toString()).set('lon', lon.toString());
    }

    return this.http.get<WeatherResponse>(`${this.apiUrl}/current`, { params }).pipe(
      catchError(this.handleError<WeatherResponse>('getCurrentWeather'))
    );
  }

  /**
   * ✅ Récupère les prévisions météo
   */
  getForecast(city?: string, lat?: number, lon?: number, days: number = 5): Observable<ForecastResponse> {
    let params = new HttpParams().set('days', days.toString());
    if (city) {
      params = params.set('city', city);
    }
    if (lat && lon) {
      params = params.set('lat', lat.toString()).set('lon', lon.toString());
    }

    return this.http.get<ForecastResponse>(`${this.apiUrl}/forecast`, { params }).pipe(
      catchError(this.handleError<ForecastResponse>('getForecast'))
    );
  }

  /**
   * ✅ Récupère la météo pour toutes les villes avec capteurs
   */
  getCitiesWeather(): Observable<CitiesWeatherResponse> {
    return this.http.get<CitiesWeatherResponse>(`${this.apiUrl}/cities`).pipe(
      catchError(this.handleError<CitiesWeatherResponse>('getCitiesWeather'))
    );
  }

  /**
   * ✅ Récupère le dashboard météo
   */
  getWeatherDashboard(includeCities: boolean = false): Observable<any> {
    const params = new HttpParams().set('cities', includeCities.toString());
    return this.http.get(`${this.apiUrl}/dashboard`, { params }).pipe(
      catchError(this.handleError<any>('getWeatherDashboard'))
    );
  }

  /**
   * ✅ Obtenir l'URL de l'icône météo OpenWeather
   */
  getWeatherIconUrl(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  /**
   * Gère les erreurs des appels HTTP
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`❌ ${operation} a échoué:`, error.message);
      return of(result as T);
    };
  }
}