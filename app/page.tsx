'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase' 
import Link from 'next/link'

interface Local {
  id: number;
  nombre: string;
  slug: string;
  foto_banner: string;
  rubro: string;
  direccion?: string;
  descripcion?: string;
}

export default function Home() {
  const [locales, setLocales] = useState<Local[]>([]);
  const [rubroSeleccionado, setRubroSeleccionado] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function cargarLocales() {
      try {
        // OJO: Asegúrate en tu tabla que 'activo' esté escrito así (minúsculas)
        const { data, error } = await supabase
          .from('locales')
          .select('*')
          .eq('estado', 'activo'); 
        
        if (data) setLocales(data);
        if (error) console.error("Error Supabase:", error.message);
      } catch (error) {
        console.error('Error cargando locales:', error);
      } finally {
        setCargando(false);
      }
    }
    cargarLocales();
  }, []);

  // --- LÓGICA CORREGIDA PARA RUBROS MÚLTIPLES ---
  // 1. Obtenemos todos los rubros, separamos por comas y limpiamos espacios
  const todosLosRubros = locales.flatMap(l => 
    (l.rubro || 'General').split(',').map(tag => tag.trim())
  );
  // 2. Creamos el Set para eliminar duplicados
  const rubrosUnicos = ['Todos', ...Array.from(new Set(todosLosRubros))];

  const localesFiltrados = locales.filter(local => {
    // Normalizamos el rubro del local (si es nulo, usamos 'General')
    const rubroLocal = (local.rubro || 'General').toLowerCase();
    
    // CORRECCIÓN: Usamos .includes() para que si el local es "Barbería, Spa"
    // aparezca tanto si filtro por "Barbería" como por "Spa".
    const cumpleRubro = rubroSeleccionado === 'Todos' || rubroLocal.includes(rubroSeleccionado.toLowerCase());
    
    const cumpleBusqueda = local.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return cumpleRubro && cumpleBusqueda;
  });

  return (
    <main className="min-h-screen bg-white text-gray-900 pb-20">
      
      {/* --- HEADER (FIJO) --- */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out shadow-2xl overflow-hidden
          ${scrolled 
            ? 'bg-black/95 backdrop-blur-md py-3 rounded-b-[2rem]'
            : 'bg-black pt-2 pb-6 rounded-b-[2.5rem]' 
          }
        `}
      >
        
        {/* --- BOTÓN: CREA TU AGENDA --- */}
        <div className={`absolute z-[100] flex justify-end transition-all duration-500
            ${scrolled ? 'top-2 right-4' : 'top-4 right-6'} 
        `}>
            <Link href="/negocios" className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-2xl hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40 transition-all shadow-lg border border-white/10 flex flex-col items-center justify-center leading-none">
                <span className="text-[10px] md:text-xs font-medium opacity-90 mb-1">
                  🚀 ¿Tienes local?
                </span>
                <span className="text-xs md:text-sm font-bold underline decoration-white/40 underline-offset-2 group-hover:decoration-white">
                  ¡Crea tu agenda aquí!
                </span>
            </Link>
        </div>

        {/* Fondo decorativo */}
        <div className={`absolute top-0 right-0 bg-blue-600 rounded-full blur-[150px] pointer-events-none transition-all duration-500
            ${scrolled ? 'w-20 h-20 opacity-0' : 'w-96 h-96 opacity-20 -mr-20 -mt-20'}
        `}></div>

        <div className="max-w-6xl mx-auto relative z-10 px-6">
          
          {/* BLOQUE PRINCIPAL: LOGO Y TEXTO */}
          <div className={`flex items-center justify-center transition-all duration-500
              ${scrolled ? 'gap-4 mb-0 flex-row' : 'flex-col md:flex-row gap-6 md:gap-12 mb-2'}
          `}>
            
            <h1 className={`font-black leading-none tracking-tight text-center md:text-right z-10 text-white transition-all duration-500
                ${scrolled ? 'text-xl md:text-2xl' : 'text-5xl md:text-7xl'}
            `}>
              Reserva tu hora <br/>
              <span className="text-blue-500">fácil y rápido.</span>
            </h1>

            <div className={`shrink-0 flex items-center justify-center z-10 transition-all duration-500
                ${scrolled ? 'w-10 h-10' : 'w-48 h-48 md:w-64 md:h-64'}
            `}>
               {/* Asegúrate de que esta imagen exista en public/logos/ */}
               <img 
                 src="/logos/logo-agendalo.png" 
                 alt="Logo Agéndalo" 
                 className="w-full h-full object-contain drop-shadow-2xl" 
               />
            </div>
          </div>
          
          {/* BUSCADOR */}
          <div className={`relative max-w-xl mx-auto group transition-all duration-500 ease-in-out overflow-hidden
              ${scrolled ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100'}
          `}>
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="¿Buscas una barbería, clínica, salón...?" 
                className="w-full py-2.5 pl-14 pr-6 rounded-full bg-white text-gray-900 font-bold text-lg focus:ring-4 focus:ring-blue-500/30 outline-none shadow-2xl placeholder:text-gray-400 placeholder:font-medium transition-transform transform focus:scale-[1.02]"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl text-gray-400">🔍</span>
            </div>
          </div>

        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-6xl mx-auto px-6 pt-[360px] pb-10 relative z-20">
        
        {/* FILTROS DE RUBRO */}
        <div className="flex gap-3 overflow-x-auto pb-6 mb-4 no-scrollbar touch-pan-x justify-start md:justify-center">
          {rubrosUnicos.map(rubro => (
            <button
              key={rubro}
              onClick={() => setRubroSeleccionado(rubro)}
              className={`whitespace-nowrap px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-md border ${
                rubroSeleccionado === rubro 
                  ? 'bg-blue-600 text-white border-blue-600 scale-110 shadow-blue-200' 
                  : 'bg-white text-gray-700 border-gray-100 hover:border-blue-300 hover:text-blue-600 hover:-translate-y-1'
              }`}
            >
              {rubro}
            </button>
          ))}
        </div>

        {/* LISTA DE LOCALES */}
        {cargando ? (
          <div className="text-center py-20 animate-pulse text-gray-400 font-bold uppercase tracking-widest">
            Cargando locales...
          </div>
        ) : localesFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6">
            {localesFiltrados.map(local => (
              <Link key={local.id} href={`/${local.slug}`} className="group block h-full">
                <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-100/50 hover:-translate-y-2 transition-all duration-300 h-full flex flex-col">
                  
                  {/* IMAGEN DEL LOCAL */}
                  <div className="h-52 bg-gray-100 relative overflow-hidden">
                    <img 
                      src={local.foto_banner || 'https://via.placeholder.com/400x200?text=Sin+Foto'} 
                      alt={local.nombre} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                    
                    {/* ETIQUETA DE RUBRO (Solo mostramos la primera si hay muchas) */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-lg">
                      {local.rubro ? local.rubro.split(',')[0] : 'General'}
                    </div>
                  </div>

                  {/* INFO DEL LOCAL */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                      {local.nombre}
                    </h3>
                    
                    {local.direccion && (
                      <p className="text-sm text-gray-500 mb-6 flex items-center gap-1 font-medium">
                        📍 {local.direccion}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider border border-blue-100">
                        Revisa sus servicios
                      </span>
                      <span className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:scale-110 transition-all shadow-lg">
                        ➜
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200 mt-4">
            <p className="text-gray-400 font-medium text-lg">No encontramos locales de ese tipo 😢</p>
            <button 
              onClick={() => {setRubroSeleccionado('Todos'); setBusqueda('');}}
              className="mt-4 text-blue-600 font-bold hover:underline"
            >
              Ver todos los locales
            </button>
          </div>
        )}
      </div>
      
      {/* FOOTER GENERAL */}
      <footer className="mt-24 py-12 text-center border-t border-gray-100 bg-gray-50">
        <div className="flex flex-col items-center justify-center gap-4 mb-4">
           {/* Asegúrate que la ruta de la imagen sea correcta */}
           <img 
              src="/logos/logo-agendalo.png" 
              className="w-48 h-48 object-contain opacity-80 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500" 
              alt="Logo" 
           />
        </div>
        <p className="text-xs text-gray-400 max-w-xs mx-auto">
          La plataforma número 1 para reservar servicios en tu ciudad. <br/> 
          © {new Date().getFullYear()} Todos los derechos reservados.
        </p>
      </footer>

    </main>
  )
}