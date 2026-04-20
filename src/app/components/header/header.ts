import { Component, OnInit, OnDestroy } from '@angular/core'; // <-- Ajoutez OnInit
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, Subject } from 'rxjs'; // <-- Importez Observable
import { takeUntil, filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth'; // <-- Importez AuthService
import { GeolocationService, LocationState } from '../../services/geolocation';
import { SensorService } from '../../services/sensor';
import { CurrentSensorService } from '../../services/current-sensor.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header implements OnInit, OnDestroy { // <-- Implémentez OnInit

  // Déclarez un observable pour les informations de l'utilisateur
  public user$: Observable<any | null>;

  // ✅ État de la géolocalisation
  public locationState$: Observable<LocationState>;
  public nearestSensorName: string | null = null;

  private destroy$ = new Subject<void>();

  // Injectez le service
  constructor(
    private authService: AuthService,
    private geolocationService: GeolocationService,
    private sensorService: SensorService,
    private currentSensorService: CurrentSensorService
  ) {
    // Initialisez l'observable en le liant à celui du service
    this.user$ = this.authService.user$;
    this.locationState$ = this.geolocationService.locationState$;
  }

  ngOnInit(): void {
    // Le constructeur s'en occupe déjà, mais c'est une bonne pratique

    // ✅ Quand la géolocalisation réussit, trouver et sélectionner le capteur le plus proche
    this.geolocationService.locationState$.pipe(
      takeUntil(this.destroy$),
      filter(state => state.status === 'success' && !!state.position)
    ).subscribe(state => {
      const { latitude, longitude } = state.position!;
      this.sensorService.getNearestSensor(latitude, longitude)
        .pipe(takeUntil(this.destroy$))
        .subscribe(response => {
          const sensor = response.nearest_sensor;
          if (sensor) {
            this.currentSensorService.setCurrentSensor(sensor);
            this.nearestSensorName = sensor.name || sensor.city || 'Capteur trouvé';
          }
        });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ Lancer la géolocalisation manuelle
  requestGeolocation(): void {
    this.nearestSensorName = null;
    this.geolocationService.refreshLocation();
  }

  // ✅ Générer les initiales à partir du prénom et nom
  getInitials(user: any): string {
    const first = user?.firstName?.charAt(0) ?? '';
    const last = user?.lastName?.charAt(0) ?? '';
    return (first + last).toUpperCase() || '?';
  }

  scrollToSection(event: Event, sectionId: string): void {
    event.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
