'use client' // Indica que este componente tiene interactividad

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Definimos la estructura exacta para que TypeScript no de errores en el build
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
  // Inicializamos con un array vacío para evitar errores de "undefined"
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');

  useEffect(() => {
    // Función asíncrona para traer los datos de Supabase en Talca
    const cargarServicios = async () => {
      const { data, error } = await supabase
        .from('servicios')
        .select('*');
      
      if (error) {
        console.error('Error cargando servicios:', error);
        return;
      }
      
      if (data) setServicios(data as Servicio[]);
    };

    cargarServicios();
  }, []);

  // Creamos la lista de categorías sin duplicados
  const categorias = ['Todos', ...Array.from(new Set(servicios.map(s => s.categoria)))];

  // Lógica de filtrado instantáneo
  const serviciosFiltrados = categoriaActiva === 'Todos' 
    ? servicios 
    : servicios.filter(s => s.categoria === categoriaActiva);

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-gray-900">Agéndalo Talca</h1>
          <p className="text-gray-500 text-lg">Reserva de forma simple y rápida.</p>
        </header>

        {/* --- BOTONES DE FILTRO --- */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-4">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`px-6 py-2 rounded-full font-bold transition-all border whitespace-nowrap ${
                categoriaActiva === cat 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* --- GRILLA DINÁMICA --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {serviciosFiltrados.map(servicio => (
            <div key={servicio.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all">
              {/* Imagen con fallback (si no hay imagen, pone una por defecto) */}
              <div className="h-48 bg-gray-200 overflow-hidden">
                <img 
                  src={servicio.imagen_url || 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=500'} 
                  alt={servicio.nombre}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6">
                <div className="text-xs font-bold text-blue-600 uppercase mb-2">{servicio.categoria}</div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">{servicio.nombre}</h2>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-gray-900">
                    ${servicio.precio.toLocaleString('es-CL')}
                  </span>
                  <a 
                    href={`/local/${servicio.local_slug}`}
                    className="bg-gray-900 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors"
                  >
                    Ver Local
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