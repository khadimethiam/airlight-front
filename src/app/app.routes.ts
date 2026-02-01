// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { Dashboard } from './pages/dashboard/dashboard';
import { DashboardOverview } from './pages/dashboard-overview/dashboard-overview';
import { Auth } from './pages/auth/auth';
import { AuthCallback } from './pages/auth-callback/auth-callback';
import { authGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard'; 
import { SensorAnalysis } from './pages/sensor-analysis/sensor-analysis';
import { AlertsCenter } from './pages/alerts-center/alerts-center';
import { PredictionsViewer } from './pages/predictions-viewer/predictions-viewer';

export const routes: Routes = [
    {
        path: '',
        component: Landing,
        title: 'AirLight - Accueil'
    },
    {
        path: 'auth',
        component: Auth,
        title: 'AirLight - Authentification'
    },
    {
        path: 'auth/callback',
        component: AuthCallback,
        title: 'Redirection...'
    },
    {
        path: 'dashboard',
        component: Dashboard,
        title: 'AirLight - Dashboard',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'overview',
                pathMatch: 'full'
            },
            {
                path: 'overview',
                component: DashboardOverview,
                title: 'Dashboard - Vue d\'ensemble',
                canActivate: [AdminGuard] 
            },
            {
                path: 'sensors',
                component: SensorAnalysis,
                title: 'Dashboard - Analyse des Capteurs'
            },
            {
                path: 'alerts',
                component: AlertsCenter,
                title: 'Dashboard - Centre d\'Alertes'
            },
            {
                path: 'predictions',
                component: PredictionsViewer,
                title: 'Dashboard - Prédictions IA'
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];