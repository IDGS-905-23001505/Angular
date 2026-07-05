import { HomeComponent } from './components/home/home';
import { Routes } from '@angular/router';
import { ListaProductosComponent } from './components/lista-productos/lista-productos';
import { ContactoComponent } from './components/contacto/contacto';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: HomeComponent },
  { path: 'productos', component: ListaProductosComponent },
  { path: 'contacto', component: ContactoComponent }
];
