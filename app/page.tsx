'use client' // Permitimos interactividad (filtros y clics) en el navegador
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Definimos la estructura de los datos que vienen de la tabla 'servicios'
interface Servicio {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  local: string;
  local_slug: string;
  imagen_url: string; // Nueva columna para las fotos de los locales
}

export default function Home() {
  // Estado para guardar la lista completa de servicios
  const [servicios, setServicios] = useState<Servicio[]>([]);
  // Estado para saber qué categoría seleccionó el usuario (por defecto 'Todos')
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');

  // Hook que se ejecuta al cargar la página para traer los datos de Supabase
  useEffect(() => {
    async function cargarServicios() {
      const { data } = await supabase
        .from('servicios')
        .select('*'); // Traemos todas las columnas
      if (data) setServicios(data);
    }
    cargarServicios();
  }, []);

  // Creamos una lista de categorías únicas extrayéndolas de los servicios existentes
  // El 'Set' elimina los duplicados (ej: si hay 5 barberías, solo aparece una vez 'Barbería')
  const categorias = ['Todos', ...new Set(servicios.map(s => s.categoria))];

  // Filtramos la lista en tiempo real según el botón que presione el usuario
  const serviciosFiltrados = categoriaActiva === 'Todos' 
    ? servicios 
    : servicios.filter(s => s.categoria === categoriaActiva);

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Cabecera Principal */}
        <header className="mb-12">
          <h1 className="text-4xl font-black tracking-tight mb-2">Agéndalo Talca</h1>
          <p className="text-gray-500 text-lg">Descubre y reserva en los mejores servicios de la ciudad.</p>
        </header>

        {/* --- SECCIÓN DE FILTROS --- */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-4 scrollbar-hide">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)} // Al hacer clic, filtramos la lista
              className={`px-6 py-2 rounded-full font-bold transition-all border whitespace-nowrap ${
                categoriaActiva === cat 
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* --- GRILLA DE TARJETAS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {serviciosFiltrados.map(servicio => (
            <div 
              key={servicio.id} 
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group"
            >
              {/* Contenedor de la Imagen con efecto zoom */}
              <div className="h-56 overflow-hidden relative">
                <img 
                  src={servicio.imagen_url || 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=500'} 
                  alt={servicio.nombre}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Etiqueta de Categoría sobre la imagen */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-blue-600 uppercase">
                  {servicio.categoria}
                </div>
              </div>

              {/* Información del Servicio */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                  {servicio.nombre}
                </h2>
                <p className="text-gray-500 text-sm mb-6 flex items-center">
                  <span className="mr-1">📍</span> {servicio.local}
                </p>
                
                {/* Fila de Precio y Botón de Navegación */}
                <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Precio</p>
                    <span className="text-2xl font-black text-gray-900">
                      ${servicio.precio.toLocaleString('es-CL')}
                    </span>
                  </div>
                  
                  {/* Este enlace lleva a la página dinámica del local que creamos antes */}
                  <a 
                    href={`/local/${servicio.local_slug}`}
                    className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all active:scale-95"
                  >
                    Ver Local
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mensaje en caso de que no existan servicios en esa categoría */}
        {serviciosFiltrados.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 font-medium">No hay servicios disponibles en esta categoría todavía.</p>
          </div>
        )}
      </div>
    </main>
  );
}