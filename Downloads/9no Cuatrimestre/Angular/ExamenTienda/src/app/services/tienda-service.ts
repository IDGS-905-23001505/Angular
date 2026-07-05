import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IProducto } from '../interfaces/producto';

@Injectable({
  providedIn: 'root',
})
export class TiendaService {
  private endPoint: string = environment.endPoint;
  private apiUrl: string = this.endPoint + "Tiendas/";

  constructor(private http: HttpClient) {}

  getList(): Observable<IProducto[]> {
    return this.http.get<IProducto[]>(`${this.apiUrl}ListaProductos`);
  }

  add(request: IProducto): Observable<IProducto> {
    return this.http.post<IProducto>(`${this.apiUrl}AgregarProducto`, request);
  }

  update(request: IProducto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}ModificarProducto/${request.idProducto}`, request);
  }

  delete(idProducto: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}EliminarProducto/${idProducto}`);
  }
}
