import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardData } from '../../services/dashboard'; // <-- Importez le service et l'interface

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-overview.html',
  styleUrls: ['./dashboard-overview.css']
})
export class DashboardOverview implements OnInit {
  
  public dashboardData?: DashboardData['data']; // Pour stocker les données
  public isLoading = true;
  public errorMessage: string | null = null;

  // Injectez le service
  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.dashboardService.getOverviewData().subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboardData = response.data;
        } else {
          this.errorMessage = "Les données du tableau de bord n'ont pas pu être chargées.";
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Une erreur de communication avec le serveur est survenue.';
        this.isLoading = false;
      }
    });
  }
}
