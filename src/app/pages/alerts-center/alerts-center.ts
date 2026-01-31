// src/app/pages/alerts-center/alerts-center.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertService, Alert } from '../../services/alert';
import { SensorService, Sensor } from '../../services/sensor';

@Component({
  selector: 'app-alerts-center',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alerts-center.html',
  styleUrls: ['./alerts-center.css']
})
export class AlertsCenter implements OnInit {

  public alerts: Alert[] = [];
  public sensors: Sensor[] = [];
  public isLoading = true;

  // ✅ Pagination
  public currentPage = 1;
  public itemsPerPage = 8;
  public totalPages = 0;
  public paginatedAlerts: Alert[] = [];

  // Modèle pour les filtres (temps réel)
  public filters = {
    severity: '',
    sensorId: '',
    isActive: 'true' // Par défaut, on affiche les alertes actives
  };

  constructor(
    private alertService: AlertService,
    private sensorService: SensorService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadInitialData();

    // ✅ Vérifier si un filtre de sévérité est passé en query param
    this.route.queryParams.subscribe(params => {
      if (params['severity']) {
        this.filters.severity = params['severity'];
      }
    });
  }

  loadInitialData(): void {
    this.isLoading = true;

    // Charge la liste des capteurs pour le filtre
    this.sensorService.getSensors().subscribe(response => {
      if (response.success) {
        this.sensors = response.data;
      }
    });

    // Charge les alertes
    this.applyFilters();
  }

  // ✅ Application des filtres en temps réel
  applyFilters(): void {
    this.isLoading = true;

    // Construire les filtres pour l'API
    const apiFilters: any = {};

    if (this.filters.severity) {
      apiFilters.severity = this.filters.severity;
    }

    if (this.filters.sensorId) {
      apiFilters.sensorId = this.filters.sensorId;
    }

    if (this.filters.isActive !== '') {
      apiFilters.isActive = this.filters.isActive === 'true';
    }

    this.alertService.getAlerts(apiFilters).subscribe(response => {
      if (response.success) {
        this.alerts = response.data;
        this.currentPage = 1; // ✅ Reset à la page 1 lors d'un nouveau filtre
        this.updatePagination();
      }
      this.isLoading = false;
    });
  }

  // ============================================
  // ✅ PAGINATION
  // ============================================

  updatePagination(): void {
    this.totalPages = Math.ceil(this.alerts.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedAlerts = this.alerts.slice(startIndex, endIndex);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
      this.scrollToTop();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
      this.scrollToTop();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      this.scrollToTop();
    }
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage;
  }

  getEndIndex(): number {
    const end = this.currentPage * this.itemsPerPage;
    return end > this.alerts.length ? this.alerts.length : end;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ============================================
  // ✅ HELPERS POUR LES CAPTEURS
  // ============================================

  getSensorName(sensorId: string): string {
    const sensor = this.sensors.find(s => s.id === sensorId);
    return sensor ? sensor.name : sensorId;
  }

  getSensorCity(sensorId: string): string {
    const sensor = this.sensors.find(s => s.id === sensorId);
    return sensor ? sensor.city : 'Inconnu';
  }

  // ============================================
  // ✅ LABELS EN FRANÇAIS
  // ============================================

  getSeverityLabel(severity: string): string {
    const labels: { [key: string]: string } = {
      'hazardous': 'Dangereux',
      'unhealthy': 'Malsain',
      'poor': 'Mauvais',
      'moderate': 'Modéré',
      'good': 'Bon'
    };
    return labels[severity] || severity;
  }

  getSeverityIcon(severity: string): string {
    const icons: { [key: string]: string } = {
      'hazardous': '',
      'unhealthy': '',
      'poor': '',
      'moderate': '',
      'good': ''
    };
    return icons[severity] || '';
  }

  getSeverityClass(severity: string): string {
    const classes: { [key: string]: string } = {
      'hazardous': 'severity-hazardous text-white',
      'unhealthy': 'severity-unhealthy text-white',
      'poor': 'severity-poor text-dark',
      'moderate': 'severity-moderate text-dark',
      'good': 'severity-good text-white'
    };
    return classes[severity] || 'bg-secondary text-white';
  }

  // ============================================
  // ✅ FORMATAGE DE DATE
  // ============================================

  formatDate(dateString: string): string {
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

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ============================================
  // ✅ STATISTIQUES RAPIDES
  // ============================================

  getActiveAlertsCount(): number {
    return this.alerts.filter(a => a.isActive).length;
  }

  getCriticalAlertsCount(): number {
    return this.alerts.filter(a =>
      a.severity === 'hazardous' || a.severity === 'unhealthy'
    ).length;
  }

  getAffectedSensorsCount(): number {
    const uniqueSensors = new Set(this.alerts.map(a => a.sensorId));
    return uniqueSensors.size;
  }

  // ============================================
  // ✅ EXPORT CSV
  // ============================================

  exportToCSV(): void {
    if (this.alerts.length === 0) {
      alert('Aucune alerte à exporter');
      return;
    }

    // Préparer les données CSV
    const headers = ['Sévérité', 'Capteur', 'Ville', 'Message', 'Date', 'État'];
    const rows = this.alerts.map(alert => [
      this.getSeverityLabel(alert.severity),
      this.getSensorName(alert.sensorId),
      this.getSensorCity(alert.sensorId),
      alert.message,
      new Date(alert.createdAt).toLocaleString('fr-FR'),
      alert.isActive ? 'Active' : 'Inactive'
    ]);

    // Créer le CSV
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    // Télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `alertes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ============================================
  // ✅ RESET FILTRES
  // ============================================

  resetFilters(): void {
    this.filters = {
      severity: '',
      sensorId: '',
      isActive: 'true'
    };
    this.applyFilters();
  }
}
