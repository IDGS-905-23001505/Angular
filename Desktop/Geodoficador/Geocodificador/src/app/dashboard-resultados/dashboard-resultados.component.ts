import { Component, OnInit, AfterViewInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Chart } from 'chart.js/auto';
import { EstadisticaService } from '../dashboard-resultados/estadistica.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';

interface Estadisticas {
  totalRegistros: number;
  exactos: number;
  revision: number;
  fallidos: number;
}

interface CalidadDatos {
  alta: number;
  medio: number;
  bajo: number;
  muyBajo: number;
}

interface ApiResponse {
  datos?: any;
  estadisticas?: Estadisticas;
  calidad?: CalidadDatos;
  totalRegistros?: number;
  exactos?: number;
  revision?: number;
  fallidos?: number;
  total?: number;
}

interface Lote {
  id_lote: number;
  nombre_archivo: string;
  total_registros: number;
  fecha_carga: string;
  estatus: string;
  entradas?: number;
  salidas?: number;
  porcentaje_procesado?: string;
}

@Component({
  selector: 'app-dashboard-resultados',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard-resultados.component.html',
  styleUrls: ['./dashboard-resultados.component.css']
})
export class DashboardResultadosComponent implements OnInit, AfterViewInit, OnDestroy {
  // Inyecciones
  private estadisticaService = inject(EstadisticaService);
  private http = inject(HttpClient);
  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);

  // Subscripciones
  private dataSubscription = new Subscription();

  // Datos (públicos para el template)
  estadisticas: Estadisticas = this.getEstadisticasIniciales();
  calidadDatos: CalidadDatos = this.getCalidadInicial();

  // Estados (públicos para el template)
  isLoading = true;
  hasError = false;
  errorMessage = '';
  datosCargados = false;
  today = new Date();

  // Nuevas variables para el selector de lotes
  mostrarSelectorLotes = false;
  cargandoLotes = false;
  errorCargarLotes = '';
  lotes: Lote[] = [];
  lotesFiltrados: Lote[] = [];
  busquedaLote = '';
  descargandoLote: number | null = null;
  formatoDescarga: 'excel' | 'csv' | 'json' = 'excel';

  // Gráfica
  private chart: Chart | null = null;

  // Constantes
  private readonly COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
  private readonly CHART_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 20,
          font: { size: 14, family: "'Segoe UI', sans-serif" },
          color: '#374151'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: { size: 14 },
        bodyFont: { size: 14 },
        padding: 12,
        cornerRadius: 8
      }
    },
    cutout: '65%'
  };

  // Getters públicos para el template
  get porcentajeExactos(): string { return this.calcularPorcentaje(this.estadisticas.exactos); }
  get porcentajeRevision(): string { return this.calcularPorcentaje(this.estadisticas.revision); }
  get porcentajeFallidos(): string { return this.calcularPorcentaje(this.estadisticas.fallidos); }

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  ngAfterViewInit(): void {
    // Vista inicializada
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // ========== MÉTODOS PÚBLICOS PARA EL TEMPLATE ==========

  cargarEstadisticas(): void {
    this.prepararCarga();

    this.dataSubscription = this.estadisticaService.obtenerDashboard().subscribe({
      next: (data) => this.procesarRespuesta(data),
      error: (error) => this.manejarError(error)
    });
  }

  visualizarEnMapa(): void {
    if (!this.datosCargados || this.estadisticas.totalRegistros === 0) {
      alert('No hay datos para visualizar en el mapa');
      return;
    }

    this.router.navigate(['/visor'], {
      state: {
        fromDashboard: true,
        estadisticas: this.estadisticas,
        calidadData: this.calidadDatos
      }
    });
  }

  // ========== NUEVO: Descarga directa sin selector ==========
  descargarReporteDirecto(): void {
    if (!this.datosCargados || this.estadisticas.totalRegistros === 0) {
      alert('No hay datos para descargar');
      return;
    }

    console.log('🔍 Abriendo selector de lotes...');
    this.abrirSelectorLotes();
  }

  // ========== MÉTODOS PARA DESCARGA POR LOTE ==========

  abrirSelectorLotes(): void {
    if (!this.datosCargados || this.estadisticas.totalRegistros === 0) {
      alert('No hay datos para generar un reporte');
      return;
    }

    this.mostrarSelectorLotes = true;
    this.cargarLotes();
  }

  cerrarSelectorLotes(): void {
    this.mostrarSelectorLotes = false;
    this.busquedaLote = '';
    this.lotesFiltrados = [...this.lotes];
    this.descargandoLote = null;
    this.cdRef.detectChanges();
  }

  cargarLotes(): void {
    this.cargandoLotes = true;
    this.errorCargarLotes = '';

    this.http.get<any>('http://localhost:3000/api/lotes/disponibles')
      .subscribe({
        next: (response) => {
          if (response.success && response.lotes) {
            this.lotes = response.lotes.map((lote: any) => ({
              id_lote: lote.id_lote,
              nombre_archivo: lote.nombre_archivo || lote.nombre_archivo_original || 'Sin nombre',
              total_registros: lote.total_registros || 0,
              fecha_carga: lote.fecha_carga,
              estatus: lote.estatus || 'desconocido',
              entradas: lote.entradas || 0,
              salidas: lote.salidas || 0,
              porcentaje_procesado: lote.porcentaje_procesado || '0%'
            }));
            this.lotesFiltrados = [...this.lotes];
          } else {
            this.errorCargarLotes = response.error || 'Error al cargar lotes';
          }
          this.cargandoLotes = false;
          this.cdRef.detectChanges();
        },
        error: (error) => {
          this.errorCargarLotes = error.message || 'Error de conexión';
          this.cargandoLotes = false;
          this.cdRef.detectChanges();
        }
      });
  }

  filtrarLotes(): void {
    if (!this.busquedaLote.trim()) {
      this.lotesFiltrados = [...this.lotes];
      return;
    }

    const busqueda = this.busquedaLote.toLowerCase().trim();
    this.lotesFiltrados = this.lotes.filter(lote =>
      lote.id_lote.toString().includes(busqueda) ||
      lote.nombre_archivo.toLowerCase().includes(busqueda)
    );
  }

  descargarReporteLote(idLote: number): void {
    if (this.descargandoLote) return;

    this.descargandoLote = idLote;
    console.log(`⬇️ Iniciando descarga del lote ${idLote} en formato ${this.formatoDescarga}...`);

    // Construir URL
    const url = `http://localhost:3000/api/lotes/${idLote}/descargar?formato=${this.formatoDescarga}`;

    // Método 1: Crear elemento <a> oculto (más confiable)
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    // Nombre del archivo
    const extension = this.getExtension(this.formatoDescarga);
    const nombreArchivo = `reporte-lote-${idLote}-${new Date().toISOString().slice(0, 10)}.${extension}`;
    link.download = nombreArchivo;

    // Añadir al DOM y hacer click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Método 2 alternativo: Abrir en nueva pestaña
    // window.open(url, '_blank');

    // Mostrar mensaje de éxito
    setTimeout(() => {
      alert(`✅ Reporte "${nombreArchivo}" se está descargando.`);
      this.descargandoLote = null;
      this.cdRef.detectChanges();
    }, 500);
  }

  private getExtension(formato: string): string {
    switch (formato) {
      case 'excel': return 'xlsx';
      case 'csv': return 'csv';
      case 'json': return 'json';
      default: return 'xlsx';
    }
  }

  // ========== MÉTODOS PRIVADOS ==========

  private prepararCarga(): void {
    this.isLoading = true;
    this.resetEstados();
    this.limpiarSubscripcion();
  }

  private procesarRespuesta(data: ApiResponse): void {
    if (this.estaVacio(data)) {
      this.mostrarSinDatos();
    } else {
      this.procesarDatos(data);
      this.datosCargados = true;
      this.inicializarGraficaConRetraso();
    }

    this.isLoading = false;
    this.cdRef.detectChanges();
  }

  private manejarError(error: any): void {
    console.error('❌ Error:', error);
    this.hasError = true;
    this.errorMessage = error.message || 'Error al conectar con el servidor';
    this.isLoading = false;
    this.datosCargados = false;
    this.mostrarErrorConexion();
    this.cdRef.detectChanges();
  }

  private estaVacio(data: ApiResponse): boolean {
    if (!data) return true;

    const datos = data.datos || data;

    if (datos.totalRegistros !== undefined) {
      return datos.totalRegistros === 0 || datos.totalRegistros === null;
    }

    if (datos.estadisticas?.totalRegistros !== undefined) {
      return datos.estadisticas.totalRegistros === 0 || datos.estadisticas.totalRegistros === null;
    }

    if (datos.total !== undefined) {
      return datos.total === 0 || datos.total === null;
    }

    return true;
  }

  private procesarDatos(data: ApiResponse): void {
    try {
      const datos = data.datos || data;

      if (datos.totalRegistros !== undefined) {
        this.estadisticas = {
          totalRegistros: datos.totalRegistros || 0,
          exactos: datos.exactos || 0,
          revision: datos.revision || 0,
          fallidos: datos.fallidos || 0
        };

        this.calidadDatos = datos.calidad
          ? { ...datos.calidad }
          : this.calcularCalidadDesdeTotales();

      } else if (datos.estadisticas) {
        this.estadisticas = { ...datos.estadisticas };
        this.calidadDatos = datos.calidad
          ? { ...datos.calidad }
          : this.calcularCalidadDesdeTotales();
      } else {
        this.mostrarSinDatos();
      }
    } catch (error) {
      console.error('💥 Error procesando datos:', error);
      this.mostrarSinDatos();
    }
  }

  private inicializarGrafica(): void {
    if (!this.datosCargados || this.estadisticas.totalRegistros === 0) {
      this.mostrarMensajeGraficaVacia();
      return;
    }

    const canvas = document.getElementById('graficaCalidad') as HTMLCanvasElement;
    if (!canvas) return;

    this.destruirGrafica();

    if (this.sumaCalidad === 0) {
      this.mostrarMensajeGraficaVacia();
      return;
    }

    try {
      this.chart = new Chart(canvas.getContext('2d')!, {
        type: 'doughnut',
        data: this.obtenerDatosGrafica(),
        options: this.CHART_OPTIONS
      });
    } catch (error) {
      console.error('💥 Error creando gráfica:', error);
    }
  }

  private inicializarGraficaConRetraso(): void {
    setTimeout(() => this.inicializarGrafica(), 100);
  }

  private obtenerDatosGrafica() {
    return {
      labels: [
        `Alta ${this.calidadDatos.alta.toFixed(1)}%`,
        `Medio ${this.calidadDatos.medio.toFixed(1)}%`,
        `Bajo ${this.calidadDatos.bajo.toFixed(1)}%`,
        `Muy Bajo ${this.calidadDatos.muyBajo.toFixed(1)}%`
      ],
      datasets: [{
        data: Object.values(this.calidadDatos),
        backgroundColor: this.COLORS,
        borderColor: '#FFFFFF',
        borderWidth: 3,
        hoverOffset: 15
      }]
    };
  }

  private calcularCalidadDesdeTotales(): CalidadDatos {
    const total = this.estadisticas.totalRegistros || 1;

    return {
      alta: total > 0 ? (this.estadisticas.exactos / total) * 100 : 0,
      medio: total > 0 ? (this.estadisticas.revision / 2 / total) * 100 : 0,
      bajo: total > 0 ? (this.estadisticas.revision / 2 / total) * 100 : 0,
      muyBajo: total > 0 ? (this.estadisticas.fallidos / total) * 100 : 0
    };
  }

  private mostrarSinDatos(): void {
    this.hasError = false;
    this.errorMessage = 'No hay datos disponibles en la base de datos';
    this.datosCargados = false;
    this.resetDatos();
  }

  private mostrarErrorConexion(): void {
    this.datosCargados = false;
    this.resetDatos();
  }

  private mostrarMensajeGraficaVacia(): void {
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
      chartContainer.innerHTML = `
        <div class="empty-chart-message">
          <div class="empty-icon">📊</div>
          <h4>No hay datos para mostrar</h4>
          <p>La base de datos está vacía o no hay registros procesados</p>
        </div>
      `;
    }
  }

  private calcularPorcentaje(valor: number): string {
    if (this.estadisticas.totalRegistros === 0) return '0.0%';
    return ((valor / this.estadisticas.totalRegistros) * 100).toFixed(1) + '%';
  }

  // ========== MÉTODOS DE LIMPIEZA ==========

  private resetEstados(): void {
    this.hasError = false;
    this.errorMessage = '';
    this.datosCargados = false;
  }

  private resetDatos(): void {
    this.estadisticas = this.getEstadisticasIniciales();
    this.calidadDatos = this.getCalidadInicial();
    this.destruirGrafica();
  }

  private getEstadisticasIniciales(): Estadisticas {
    return { totalRegistros: 0, exactos: 0, revision: 0, fallidos: 0 };
  }

  private getCalidadInicial(): CalidadDatos {
    return { alta: 0, medio: 0, bajo: 0, muyBajo: 0 };
  }

  private limpiarSubscripcion(): void {
    this.dataSubscription.unsubscribe();
  }

  private destruirGrafica(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private cleanup(): void {
    this.limpiarSubscripcion();
    this.destruirGrafica();
  }

  // Getter auxiliar
  private get sumaCalidad(): number {
    return Object.values(this.calidadDatos).reduce((a, b) => a + b, 0);
  }
}
