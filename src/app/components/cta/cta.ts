import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cta',
  standalone: true,
  imports: [CommonModule, RouterLink], // On ajoute RouterLink pour le bouton
  templateUrl: './cta.html',
  styleUrls: ['./cta.css']
})
export class Cta {

}
