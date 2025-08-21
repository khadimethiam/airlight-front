// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { Dashboard } from './pages/dashboard/dashboard';
import { Auth } from './pages/auth/auth';
import { AuthCallback } from './pages/auth-callback/auth-callback';

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
        title: 'AirLight - Dashboard'
    },
    {
        path: '**', // Redirige toute autre URL vers la page d'accueil
        redirectTo: ''
    }
];
