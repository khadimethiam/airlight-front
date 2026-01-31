import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { WeatherService } from '../../services/weather';
import { SensorService, SensorData, Sensor } from '../../services/sensor';
import { GeolocationService } from '../../services/geolocation';
import { CurrentSensorService } from '../../services/current-sensor.service';

@Component({
  selector: 'app-current-status',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './current-status.html',
  styleUrls: ['./current-status.css']
})
export class CurrentStatus implements OnInit {

  public isLoading = true;
  public weatherData: any = null;
  public latestSensorData: SensorData | null = null;
  public aqiStatus = { level: 'Chargement...', class: 'text-muted' };

  public currentSensor: Sensor | null = null;
  public sensorDistance: string | null = null;
  public isUsingGeolocation = false;
  public geolocationError: string | null = null;

  // ✅ NOUVEAU : Liste de tous les capteurs pour le sélecteur
  public allSensors: Sensor[] = [];
  public selectedSensorId: string = '';
  public isManualSelection = false;

  // ✅ Stocker la position actuelle
  private currentPosition: { latitude: number; longitude: number } | null = null;

  constructor(
    private weatherService: WeatherService,
    private sensorService: SensorService,
    private geolocationService: GeolocationService,
    private currentSensorService: CurrentSensorService
  ) {}

  ngOnInit(): void {
    // ✅ VRAIE PARALLÉLISATION : Les deux en même temps !
    this.loadAllSensorsAsync(); // Charge la liste pour le sélecteur
    this.loadNearestSensor();   // Charge le capteur le plus proche
  }

  /**
   * ✅ Version ASYNC qui ne bloque pas
   */
  loadAllSensorsAsync(): void {
    console.log('🔄 Chargement liste capteurs (async)...');

    this.sensorService.getSensors().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allSensors = response.data
            .filter((s: any) => s.status === 'online')
            .map((s: any) => ({
              id: s.location?.id || s.id,
              name: s.location?.name || s.name,
              city: s.location?.city || s.city,
              country: s.location?.country || s.country,
              latitude: s.location?.coordinates?.lat,
              longitude: s.location?.coordinates?.lng,
              status: s.status,
              isOnline: true
            } as Sensor))
            .sort((a, b) => {
              if (a.city !== b.city) {
                return (a.city || '').localeCompare(b.city || '');
              }
              return (a.name || '').localeCompare(b.name || '');
            });

          console.log(`✅ ${this.allSensors.length} capteurs en ligne chargés`);
        }
      },
      error: (err) => console.error('❌ Erreur liste capteurs:', err)
    });
  }

  /**
   * ✅ NOUVEAU : Gérer le changement de capteur manuel
   */
  onSensorChange(): void {
  if (!this.selectedSensorId) {
    return;
  }

  const sensor = this.allSensors.find(s => s.id === this.selectedSensorId);
  if (!sensor) {
    return;
  }

  console.log('🔄 Changement manuel de capteur vers:', sensor.name);

  this.isManualSelection = true;
  this.isUsingGeolocation = false;
  this.sensorDistance = null;
  this.isLoading = true;

  this.loadSensorData(sensor).subscribe({
    next: ({ weather, sensor }) => {
      // ✅ CORRECTION : Vérifier que weather existe avant d'accéder à success
      if (weather && weather.success && weather.data) {
        this.weatherData = weather.data;
        console.log('🌤️ Météo mise à jour pour:', this.currentSensor?.city);
      } else {
        console.warn('⚠️ Données météo non disponibles');
        this.weatherData = null; // Initialiser à null pour éviter les erreurs
      }

      if (sensor && sensor.success && sensor.data) {
        this.latestSensorData = sensor.data;
        this.updateAqiStatus(sensor.data.airQualityIndex);
        console.log('✅ Données capteur mises à jour, AQI:', sensor.data.airQualityIndex);
      }

      this.isLoading = false;
    },
    error: (err) => {
      console.error('❌ Erreur chargement données:', err);
      this.weatherData = null; // ✅ Important !
      this.isLoading = false;
    }
  });
}

  /**
   * ✅ NOUVEAU : Retour à la géolocalisation
   */
  useGeolocation(): void {
    console.log('📍 Retour à la géolocalisation automatique');
    this.isManualSelection = false;
    this.selectedSensorId = '';
    this.loadNearestSensor();
  }

  /**
   * Charge le capteur le plus proche via géolocalisation
   */
  loadNearestSensor(): void {
    this.isLoading = true;
    this.geolocationError = null;

    this.geolocationService.getCurrentPosition().pipe(
      switchMap(position => {
        console.log('📍 Position obtenue:', position);
        this.isUsingGeolocation = true;
        this.currentPosition = { latitude: position.latitude, longitude: position.longitude };

        return this.sensorService.getNearestSensor(position.latitude, position.longitude).pipe(
          catchError(error => {
            console.warn('⚠️ getNearestSensor a échoué, recherche manuelle...', error);
            return this.findNearestSensorManually(position.latitude, position.longitude);
          })
        );
      }),
      switchMap(nearestResponse => {
        if (nearestResponse.success && nearestResponse.nearest_sensor) {
          const sensor = nearestResponse.nearest_sensor;

          // ✅ Mettre à jour le sélecteur
          this.selectedSensorId = sensor.id;

          return this.loadSensorData(sensor, sensor.distance);
        } else {
          console.warn('⚠️ Aucun capteur proche trouvé, recherche d\'un capteur en ligne');
          return this.loadFirstOnlineSensor();
        }
      }),
      catchError(error => {
        console.error('❌ Erreur géolocalisation:', error);
        this.geolocationError = error.message || 'Impossible d\'obtenir votre position';
        this.isUsingGeolocation = false;
        return this.loadFirstOnlineSensor();
      })
    ).subscribe({
      next: ({ weather, sensor }) => {
        if (weather.success && weather.data) {
          this.weatherData = weather.data;
          console.log('🌤️ Icon code:', weather.data.current.weather.icon);
        } else {
          console.warn('⚠️ Aucune donnée météo disponible');
        }

        if (sensor.success && sensor.data) {
          this.latestSensorData = sensor.data;
          this.updateAqiStatus(sensor.data.airQualityIndex);
        } else {
          console.warn('⚠️ Aucune donnée de capteur disponible');
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Erreur finale:', err);
        this.isLoading = false;
      }
    });
  }

  /**
   * ✅ NOUVEAU : Charger les données d'un capteur spécifique
   */
  private loadSensorData(sensor: Sensor, distance?: number) {
    this.currentSensor = sensor;
    this.currentSensorService.setCurrentSensor(sensor);

    if (distance !== undefined) {
      this.sensorDistance = this.geolocationService.formatDistance(distance);
    } else {
      this.sensorDistance = null;
    }

    console.log('🎯 Capteur sélectionné:', sensor);

    // ✅ CORRECTION : Utiliser undefined au lieu de null
    return forkJoin({
      weather: sensor.latitude && sensor.longitude
        ? this.weatherService.getCurrentWeather(undefined, sensor.latitude, sensor.longitude)
        : this.weatherService.getCurrentWeather(sensor.city || 'Dakar'),
      sensor: this.sensorService.getLatestSensorData(sensor.id)
    }).pipe(
      catchError(error => {
        console.error('❌ loadSensorData a échoué:', error);
        return of({
          weather: { success: false, data: null },
          sensor: { success: false, data: null }
        });
      })
    );
  }

  /**
   * Recherche manuelle du capteur le plus proche
   */
  private findNearestSensorManually(lat: number, lon: number) {
    return this.sensorService.getSensors().pipe(
      switchMap(response => {
        if (!response.success || !response.data || response.data.length === 0) {
          throw new Error('Aucun capteur disponible');
        }

        const sensorsWithDistance = response.data
          .filter((s: Sensor) => {
            const hasCoords = s.latitude !== undefined && s.longitude !== undefined;
            const isOnline = s.status === 'online' || s.isOnline === true;
            return hasCoords && isOnline;
          })
          .map((s: Sensor) => ({
            ...s,
            distance: this.geolocationService.calculateDistance(
              lat, lon,
              s.latitude!, s.longitude!
            )
          }))
          .sort((a, b) => a.distance! - b.distance!);

        if (sensorsWithDistance.length === 0) {
          throw new Error('Aucun capteur en ligne avec coordonnées GPS');
        }

        const nearest = sensorsWithDistance[0];
        console.log('📍 Capteur le plus proche trouvé manuellement:', nearest);

        return of({
          success: true,
          nearest_sensor: nearest
        });
      })
    );
  }

  /**
   * Charger le premier capteur en ligne disponible
   */
  private loadFirstOnlineSensor() {
    return this.sensorService.getSensors().pipe(
      switchMap(response => {
        if (!response.success || !response.data || response.data.length === 0) {
          console.error('❌ Aucun capteur disponible dans la réponse');
          throw new Error('Aucun capteur disponible');
        }

        const onlineSensor = response.data.find((s: Sensor) =>
          s.status === 'online' || s.isOnline === true
        );

        if (!onlineSensor) {
          console.error('❌ Aucun capteur en ligne trouvé');
          throw new Error('Aucun capteur en ligne disponible');
        }

        // ✅ Mettre à jour le sélecteur
        this.selectedSensorId = onlineSensor.id;

        return this.loadSensorData(onlineSensor);
      }),
      catchError(error => {
        console.error('❌ Erreur fatale - Impossible de charger un capteur:', error);
        this.geolocationError = 'Aucun capteur en ligne disponible';
        this.isLoading = false;

        return of({
          weather: { success: false, data: null },
          sensor: { success: false, data: null }
        });
      })
    );
  }

  refreshNearestSensor(): void {
    if (this.isManualSelection) {
      // ✅ CORRECTION : En mode manuel, recharger les données du capteur sélectionné
      console.log('🔄 Actualisation en mode manuel');
      this.onSensorChange();
    } else {
      // Sinon, relancer la géolocalisation
      console.log('🔄 Actualisation en mode géolocalisation');
      this.loadNearestSensor();
    }
  }

  getAqiCursorPosition(): string {
    if (!this.latestSensorData) {
      return '0%';
    }

    const aqi = this.latestSensorData.airQualityIndex;
    const maxAqiForScale = 300;
    const percentage = Math.min((aqi / maxAqiForScale) * 100, 100);

    return `${percentage}%`;
  }

  updateAqiStatus(aqi: number): void {
    if (aqi <= 50) {
      this.aqiStatus = { level: 'Bon', class: 'status-good' };
    } else if (aqi <= 100) {
      this.aqiStatus = { level: 'Modéré', class: 'status-moderate' };
    } else if (aqi <= 150) {
      this.aqiStatus = { level: 'Sensible', class: 'status-sensitive' };
    } else if (aqi <= 200) {
      this.aqiStatus = { level: 'Mauvais', class: 'status-unhealthy' };
    } else if (aqi <= 300) {
      this.aqiStatus = { level: 'Très mauvais', class: 'status-very-unhealthy' };
    } else {
      this.aqiStatus = { level: 'Dangereux', class: 'status-hazardous' };
    }
  }

  getAqiBackgroundClass(): string {
    if (!this.latestSensorData) {
      return 'aqi-bg-loading';
    }

    const aqi = this.latestSensorData.airQualityIndex;

    if (aqi <= 50) {
      return 'aqi-bg-good';
    } else if (aqi <= 100) {
      return 'aqi-bg-moderate';
    } else if (aqi <= 150) {
      return 'aqi-bg-sensitive';
    } else if (aqi <= 200) {
      return 'aqi-bg-unhealthy';
    } else if (aqi <= 300) {
      return 'aqi-bg-very-unhealthy';
    } else {
      return 'aqi-bg-hazardous';
    }
  }

  getWeatherBackgroundClass(): string {
    if (!this.weatherData) {
      return 'bg-light-subtle';
    }

    const iconCode = this.weatherData.current.weather.icon;
    const isDay = iconCode.includes('d');

    if (['01d', '01n'].includes(iconCode)) {
      return isDay ? 'weather-bg-clear-day' : 'weather-bg-clear-night';
    }
    if (['02d', '02n', '03d', '03n', '04d', '04n'].includes(iconCode)) {
      return isDay ? 'weather-bg-cloudy-day' : 'weather-bg-cloudy-night';
    }
    if (['09d', '09n', '10d', '10n'].includes(iconCode)) {
      return 'weather-bg-rain';
    }
    if (['11d', '11n'].includes(iconCode)) {
      return 'weather-bg-thunderstorm';
    }
    if (['13d', '13n'].includes(iconCode)) {
      return 'weather-bg-snow';
    }
    if (['50d', '50n'].includes(iconCode)) {
      return 'weather-bg-mist';
    }

    return 'bg-light-subtle';
  }

  getWeatherIconClass(iconCode: string): string {
    const iconMap: { [key: string]: string } = {
      '01d': 'fa-sun text-warning',
      '01n': 'fa-moon text-light',
      '02d': 'fa-cloud-sun text-warning',
      '02n': 'fa-cloud-moon text-light',
      '03d': 'fa-cloud text-white',
      '03n': 'fa-cloud text-white',
      '04d': 'fa-cloud text-white-50',
      '04n': 'fa-cloud text-white-50',
      '09d': 'fa-cloud-showers-heavy text-info',
      '09n': 'fa-cloud-showers-heavy text-info',
      '10d': 'fa-cloud-rain text-info',
      '10n': 'fa-cloud-rain text-info',
      '11d': 'fa-bolt text-warning',
      '11n': 'fa-bolt text-warning',
      '13d': 'fa-snowflake text-light',
      '13n': 'fa-snowflake text-light',
      '50d': 'fa-smog text-white-50',
      '50n': 'fa-smog text-white-50'
    };

    return `fas ${iconMap[iconCode] || 'fa-cloud-sun text-white'}`;
  }

  /**
   * ✅ NOUVEAU : Grouper les capteurs par ville pour l'affichage
   */
  get sensorsByCity(): { [city: string]: Sensor[] } {
    return this.allSensors.reduce((groups, sensor) => {
      const city = sensor.city || 'Autres';
      if (!groups[city]) {
        groups[city] = [];
      }
      groups[city].push(sensor);
      return groups;
    }, {} as { [city: string]: Sensor[] });
  }

  /**
   * ✅ NOUVEAU : Obtenir les villes uniques triées
   */
  get cities(): string[] {
    return Object.keys(this.sensorsByCity).sort();
  }
}
