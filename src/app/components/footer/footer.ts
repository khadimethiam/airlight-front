import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink], // RouterLink pour les liens de navigation
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class Footer {

}
