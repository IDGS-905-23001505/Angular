import { Component, signal, inject } from '@angular/core';
import { IProducto } from './interfaces/producto';
import { TiendaService } from './services/tienda-service';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  ListaProductos = signal<IProducto[]>([]);
  isResultLoaded = signal<boolean>(false);

  private _productoService = inject(TiendaService);

  constructor(){
    this.obtenerProductos();
  }

  obtenerProductos(){
    this._productoService.getList().subscribe({
      next: (data) => {
        this.ListaProductos.set(data);
        this.isResultLoaded.set(true);
      },
      error: (e) => { console.log(e) }
    });
  }
}
