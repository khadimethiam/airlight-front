import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar implements OnInit {

  public user$: Observable<any | null>;
  public isAdmin$: Observable<boolean>;

  // ✅ État de la sidebar
  public isCollapsed = false;
  public isMobile = false;

  constructor(private authService: AuthService) {
    this.user$ = this.authService.user$;
    this.isAdmin$ = this.authService.isAdmin$;
  }

  ngOnInit(): void {
    this.checkScreenSize();
    // Sur mobile, la sidebar est fermée par défaut
    if (this.isMobile) {
      this.isCollapsed = true;
    }
  }

  // ✅ Détecter le redimensionnement de l'écran
  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 768;

    // Sur mobile, fermer la sidebar
    if (this.isMobile && !wasMobile) {
      this.isCollapsed = true;
    }
    // Sur desktop, ouvrir la sidebar
    else if (!this.isMobile && wasMobile) {
      this.isCollapsed = false;
    }
  }

  // ✅ Toggle la sidebar (mobile uniquement)
  toggleSidebar(): void {
    if (this.isMobile) {
      this.isCollapsed = !this.isCollapsed;
    }
  }

  // ✅ Fermer la sidebar (mobile uniquement)
  closeSidebar(): void {
    if (this.isMobile) {
      this.isCollapsed = true;
    }
  }

  // ✅ Générer les initiales à partir du prénom et nom
  getInitials(user: any): string {
    const first = user?.firstName?.charAt(0) ?? '';
    const last = user?.lastName?.charAt(0) ?? '';
    return (first + last).toUpperCase() || '?';
  }

  // ✅ Obtenir le label du rôle en français
  getRoleLabel(role: string): string {
    const roleLabels: { [key: string]: string } = {
      'admin': 'Administrateur',
      'user': 'Utilisateur'
      
    };
    return roleLabels[role] || role;
  }

  logout(): void {
    this.authService.logout();
  }
}
