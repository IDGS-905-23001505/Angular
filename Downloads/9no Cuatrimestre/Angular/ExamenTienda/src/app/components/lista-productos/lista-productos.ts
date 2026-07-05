import { Component, signal, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TiendaService } from '../../services/tienda-service';
import { IProducto } from '../../interfaces/producto';

@Component({
  selector: 'app-lista-productos',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="filtros-container">
      <select [(ngModel)]="categoriaSeleccionada" class="form-control select-filtro">
        <option value="Todos">Todas las categorías</option>
        <option value="Hombre">Hombre</option>
        <option value="Mujer">Mujer</option>
      </select>

      <input type="text" [(ngModel)]="filtro" placeholder="Buscar producto..." class="form-control input-filtro">
    </div>

    <div class="galeria-productos">
      @for (p of productosFiltrados(); track p.idProducto) {
        <div class="card">
          <img [src]="p.imagen" [alt]="p.nombre">
          <h3>{{ p.nombre }}</h3>
          <p>{{ p.descripcion }}</p>
          <p><strong>\${{ p.precio }}</strong></p>
        </div>
      } @empty {
        <div class="mensaje-vacio">
          <p>No se encontraron productos en esta categoría.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .filtros-container {
      display: flex;
      justify-content: flex-end;
      gap: 15px;
      margin: 20px 5%;
      align-items: center;
    }
    .form-control {
      padding: 10px 15px;
      border: 1px solid #ffcad4;
      border-radius: 8px;
      outline: none;
      font-size: 14px;
    }
    .select-filtro { width: 180px; background: white; }
    .input-filtro { width: 250px; }

    .galeria-productos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px; }
    .card { border: 1px solid #f4978e; padding: 15px; border-radius: 10px; background: white; text-align: center; }
    .card img { width: 100%; height: 200px; object-fit: contain; background-color: #f9f9f9; border-radius: 5px; }
    .mensaje-vacio { grid-column: 1 / -1; text-align: center; padding: 50px; color: #f4978e; }
  `]
})
export class ListaProductosComponent {
  productos = signal<IProducto[]>([]);
  filtro = signal<string>('');
  categoriaSeleccionada = signal<string>('Todos');
  private service = inject(TiendaService);

  constructor() {
    this.service.getList().subscribe(data => this.productos.set(data));
  }

  productosFiltrados = computed(() => {
    const texto = this.filtro().toLowerCase();
    const cat = this.categoriaSeleccionada();
    return this.productos().filter(p => {
      const coincideTexto = p.nombre.toLowerCase().includes(texto);
      const coincideCat = (cat === 'Todos' || p.categoria === cat);
      return coincideTexto && coincideCat;
    });
  });
}
