using System;
using System.Collections.Generic;

namespace ExamenTienda.Models;

public partial class Categoria
{
    public int IdCategoria { get; set; }

    public string? Nombre { get; set; }
    public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();
}
