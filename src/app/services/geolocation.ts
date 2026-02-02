import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  constructor() { }

  /**
   * Obtenir la position actuelle de l'utilisateur
   * ✅ OPTIMISÉ pour être plus rapide
   */
  getCurrentPosition(): Observable<GeolocationPosition> {
    // Vérifier si la géolocalisation est supportée
    if (!navigator.geolocation) {
      return throwError(() => new Error('Géolocalisation non supportée par votre navigateur'));
    }

    // Retourner un Observable depuis la Promise de géolocalisation
    return new Observable(observer => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
          observer.complete();
        },
        (error) => {
          let errorMessage = 'Erreur de géolocalisation';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permission de géolocalisation refusée';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Position non disponible';
              break;
            case error.TIMEOUT:
              errorMessage = 'Délai de géolocalisation dépassé';
              break;
          }

          observer.error(new Error(errorMessage));
        },
        {
          // ✅ OPTIMISATIONS :
          enableHighAccuracy: false, // WiFi/IP au lieu de GPS (plus rapide)
          timeout: 5000,             // 5 secondes max (au lieu de 10)
          maximumAge: 60000          // Accepter position en cache (1 minute)
        }
      );
    });
  }

  /**
   * Surveiller la position en temps réel
   */
  watchPosition(): Observable<GeolocationPosition> {
    if (!navigator.geolocation) {
      return throwError(() => new Error('Géolocalisation non supportée'));
    }

    return new Observable(observer => {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          observer.next({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        },
        (error) => {
          observer.error(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      // Cleanup quand on unsubscribe
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    });
  }

  /**
 * Demander explicitement la permission de géolocalisation
 */
  async requestPermission(): Promise<boolean> {
    try {
      // Vérifier d'abord le statut actuel
      const permissionStatus = await this.checkPermission();
      
      if (permissionStatus === 'granted') {
        return true;
      }
      
      if (permissionStatus === 'denied') {
        throw new Error('Permission de géolocalisation refusée. Veuillez l\'activer dans les paramètres.');
      }

      // Forcer la demande en appelant getCurrentPosition
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              reject(new Error('Permission refusée'));
            } else {
              reject(error);
            }
          },
          { timeout: 5000, enableHighAccuracy: false }
        );
      });
    } catch (error) {
      console.error('Erreur permission:', error);
      return false;
    }
  }

  /**
   * Vérifier si l'utilisateur a donné la permission
   */
  async checkPermission(): Promise<PermissionState> {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return permission.state; // 'granted', 'denied', 'prompt'
    } catch (error) {
      return 'prompt'; // Par défaut si l'API n'est pas supportée
    }
  }

  /**
   * Calculer la distance entre deux points (en km) - Formule de Haversine
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km

    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance en km
  }

  /**
   * Convertir degrés en radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Formater la distance pour l'affichage
   */
  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)} km`;
    } else {
      return `${Math.round(distanceKm)} km`;
    }
  }

}
