using Microsoft.AspNetCore.Mvc;
using ExamenTienda.Models;
using Microsoft.EntityFrameworkCore;

namespace ExamenTienda.Controllers
{
      [Route("api/[controller]")]
        [ApiController]
        public class TiendasController : ControllerBase
        {
            private readonly BdtiendaContext _baseDatos;

            public TiendasController(BdtiendaContext baseDatos)
            {
                _baseDatos = baseDatos;
            }


        
        [HttpGet]
        [Route("ListaProductos")]
        public async Task<IActionResult> Lista()
        {
            var listaProductos = await _baseDatos.Productos.Include(p => p.IdCategoriaNavigation).ToListAsync();
            return Ok(listaProductos);
        }


        
        [HttpPost]
        [Route("AgregarProducto")]
        public async Task<IActionResult> Agregar([FromBody] Producto request)
        {
            await _baseDatos.Productos.AddAsync(request);
            await _baseDatos.SaveChangesAsync();
            return Ok(request);

        }



        [HttpPut]
        [Route("ModificarProducto/{id:int}")]
        public async Task<IActionResult> Modificar(int id, [FromBody] Producto request)
        {
            var productoModificar = await _baseDatos.Productos.FindAsync(id);
            if (productoModificar == null) return BadRequest("No existe el producto");

            productoModificar.Nombre = request.Nombre;
            productoModificar.Descripcion = request.Descripcion;
            productoModificar.Precio = request.Precio;
            productoModificar.Imagen = request.Imagen;
            productoModificar.IdCategoria = request.IdCategoria; 

            await _baseDatos.SaveChangesAsync();
            return Ok();
        }


        [HttpDelete]
        [Route("EliminarProducto/{id:int}")]
        public async Task<IActionResult> Eliminar(int id)
        {
            var productoEliminar = await
                _baseDatos.Productos.FindAsync(id);
            if (productoEliminar == null)
            {
                return BadRequest("No existe el producto con id: " + id);
            }

            _baseDatos.Productos.Remove(productoEliminar);
            await _baseDatos.SaveChangesAsync();
            return Ok();
        }
    }
}