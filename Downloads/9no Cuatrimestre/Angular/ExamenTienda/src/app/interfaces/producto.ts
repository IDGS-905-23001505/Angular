export interface IProducto {
  idProducto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  categoria: string;
}

export interface ICategoria {
    idCategoria: number;
    nombre: string;
}
