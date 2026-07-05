import { Component } from '@angular/core';

@Component({
  selector: 'app-contacto',
  standalone: true,
  template: `
    <div class="contacto-info-container">
      <h2>Contáctanos</h2>
      <p class="intro">¿Tienes alguna duda o comentario? Estaremos felices de atenderte.</p>

      <div class="info-card">
        <p><strong>Atendido por:</strong> Naomi Aranzazu Esquivel Terán</p>
        <p><strong>Teléfono:</strong> 479 222 0836</p>
        <p><strong>Dirección:</strong> Tercera Orden 513, Ampliación San Francisco de Asís</p>
        <p><strong>Correo:</strong> naomiteran@mitienda.com</p>
      </div>
    </div>
  `,
  styles: [`
    .contacto-info-container { max-width: 600px; margin: 40px auto; padding: 30px; text-align: center; }
    h2 { color: #f4978e; font-size: 2.5rem; margin-bottom: 10px; }
    .intro { color: #666; margin-bottom: 30px; }
    .info-card {
      background: white;
      padding: 30px;
      border-radius: 15px;
      border: 1px solid #ffcad4;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
      line-height: 2;
      font-size: 1.1rem;
    }
  `]
})
export class ContactoComponent {}
