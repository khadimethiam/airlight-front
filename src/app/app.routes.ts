// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { Dashboard } from './pages/dashboard/dashboard';
import { DashboardOverview } from './pages/dashboard-overview/dashboard-overview';
import { Auth } from './pages/auth/auth';
import { AuthCallback } from './pages/auth-callback/auth-callback';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: '', // La route par défaut (ex: http://localhost:4200/ )
        component: Landing,
        title: 'AirLight - Accueil'
    },
    {
        path: 'auth', // La route d'authentification (ex: http://localhost:4200/auth )
        component: Auth,
        title: 'AirLight - Authentification'
    },
     {
        path: 'auth/callback', // Le chemin que le backend doit viser
        component: AuthCallback,
        title: 'Redirection...'
    },

    {
        path: 'dashboard', // La route du tableau de bord (ex: http://localhost:4200/dashboard )
        component: Dashboard,
        title: 'AirLight - Dashboard',
        canActivate: [authGuard], // On ajoute la garde d'authentification
children: [ // <-- Déclaration des routes enfants
            {
                path: '', // La route par défaut du dashboard (ex: /dashboard)
                redirectTo: 'overview', // Redirige vers la vue d'ensemble
                pathMatch: 'full'
            },
            {
                path: 'overview', // La route /dashboard/overview
                component: DashboardOverview,
                title: 'Dashboard - Vue d\'ensemble'
            },
            // Nous ajouterons les autres routes (capteurs, alertes...) ici plus tard
        ]
    },
    {
        path: '**', // Redirige toute autre URL vers la page d'accueil
        redirectTo: ''
    }
];
