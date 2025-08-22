import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gauge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gauge.html',
  styleUrls: ['./gauge.css']
})
export class GaugeComponent {
  @Input() label: string = 'Label';
  @Input() value: number = 0;
  @Input() unit: string = '';
  @Input() max: number = 100;
  @Input() status: string = 'Bon';

  // --- AJOUTEZ CE GETTER ---
  public get statusClass(): string {
    switch (this.status.toLowerCase()) {
      case 'bon':
        return 'status-bon';
      case 'modéré':
        return 'status-modere';
      case 'mauvais':
        return 'status-mauvais';
      case 'dangereux':
        return 'status-dangereux';
      default:
        return 'status-bon';
    }
  }
  // -------------------------
}
