import { Component, OnInit } from '@angular/core'; // <-- Ajoutez OnInit
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';
import { Observable } from 'rxjs'; // <-- Importez Observable

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar implements OnInit { // <-- Implémentez OnInit
  
  public user$: Observable<any | null>;
  public isAdmin$: Observable<boolean>; // <-- Observable pour le statut admin

  constructor(private authService: AuthService) {
    this.user$ = this.authService.user$;
    this.isAdmin$ = this.authService.isAdmin$; // <-- Liez l'observable admin
  }

  ngOnInit(): void {}

  logout(): void {
    this.authService.logout();
  }
}
