'use client' // Mantenemos el componente como cliente para los filtros interactivos

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Definición de la estructura de datos
interface Servicio {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  local: string;
  local_slug: string;
  imagen_url: string;
}

export default function Home() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');

  useEffect(() => {
    const cargarServicios = async () => {
      const { data, error } = await supabase
        .from('servicios')
        .select('*');
      
      if (error) {
        console.error('Error:', error);
        return;
      }
      
      if (data) setServicios(data as Servicio[]);
    };

    cargarServicios();
  }, []);

  const categorias = ['Todos', ...Array.from(new Set(servicios.map(s => s.categoria)))];

  const serviciosFiltrados = categoriaActiva === 'Todos' 
    ? servicios 
    : servicios.filter(s => s.categoria === categoriaActiva);

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-gray-900">Agéndalo Talca</h1>
          <p className="text-gray-500 text-lg">Descubre y reserva servicios locales.</p>
        </header>

        {/* Filtros por Categoría */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-4">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`px-6 py-2 rounded-full font-bold transition-all border whitespace-nowrap ${
                categoriaActiva === cat 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grilla de servicios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {serviciosFiltrados.map(servicio => (
            <div key={servicio.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all">
              {/* Imagen del servicio */}
              <div className="h-48 bg-gray-200 overflow-hidden">
                <img 
                  src={servicio.imagen_url || 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=500'} 
                  alt={servicio.nombre}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6">
                {/* Categoría y Nombre del Local juntos en la misma línea */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-blue-600 uppercase">
                    {servicio.categoria}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    {servicio.local}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-6 lowercase first-letter:uppercase">
                  {servicio.nombre}
                </h2>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-gray-900">
                    ${servicio.precio.toLocaleString('es-CL')}
                  </span>
                  
                  {/* Botón renombrado a "Agendar" para ser más directo */}
                  <a 
                    href={`/local/${servicio.local_slug}`}
                    className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors shadow-sm"
                  >
                    Agendar
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}