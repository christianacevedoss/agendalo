'use client' // Necesario para manejar estados y clics del usuario

import { useState, useEffect, use } from 'react'
import { supabase } from '../../../lib/supabase'

export default function PaginaLocal(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  
  // --- ESTADOS DE DATOS ---
  const [local, setLocal] = useState<any>(null);
  const [servicios, setServicios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // --- ESTADOS DEL FORMULARIO ---
  const [mostrarForm, setMostrarForm] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<any>(null);
  
  // Datos que el cliente ingresará
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');

  // Cargar información del local y sus servicios al entrar a la página
  useEffect(() => {
    async function cargarDatos() {
      // 1. Buscamos los detalles del local (banner, nombre, etc)
      const { data: datosLocal } = await supabase
        .from('locales')
        .select('*')
        .eq('slug', params.slug)
        .single();

      // 2. Buscamos los servicios asociados a este local
      const { data: datosServicios } = await supabase
        .from('servicios')
        .select('*')
        .eq('local_slug', params.slug);

      if (datosLocal) setLocal(datosLocal);
      if (datosServicios) setServicios(datosServicios);
      setCargando(false);
    }
    cargarDatos();
  }, [params.slug]);

  // Función para procesar la reserva
  const procesarAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Insertamos la nueva fila en la tabla 'agendamientos'
    const { error } = await supabase
      .from('agendamientos')
      .insert([
        {
          cliente_nombre: nombre,
          cliente_email: email,
          cliente_telefono: telefono,
          servicio_id: servicioSeleccionado.id,
          fecha_hora: new Date().toISOString() // Grabamos la fecha del momento
        }
      ]);

    if (error) {
      alert('Hubo un problema al guardar tu cita: ' + error.message);
    } else {
      alert('¡Cita agendada con éxito! Revisa tu base de datos en Supabase.');
      // Limpiamos y cerramos el formulario
      setNombre('');
      setEmail('');
      setTelefono('');
      setMostrarForm(false);
    }
  };

  if (cargando) return <div className="p-20 text-center font-bold">Cargando local...</div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* BANNER DINÁMICO */}
      <div className="h-64 bg-blue-900 relative">
        <img 
          src={local?.foto_banner || 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200'} 
          className="w-full h-full object-cover opacity-50"
          alt="Banner local"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <h1 className="text-5xl font-black uppercase">{local?.nombre}</h1>
        </div>
      </div>

      {/* LISTADO DE SERVICIOS */}
      <div className="max-w-3xl mx-auto mt-10 p-4">
        <h2 className="text-2xl font-bold mb-6">Selecciona un servicio:</h2>
        <div className="space-y-4">
          {servicios.map(s => (
            <div key={s.id} className="bg-white p-6 rounded-2xl shadow-sm flex justify-between items-center border border-gray-100">
              <div>
                <h3 className="font-bold text-lg">{s.nombre}</h3>
                <p className="text-blue-600 font-bold">${s.precio.toLocaleString('es-CL')}</p>
              </div>
              <button 
                onClick={() => { setServicioSeleccionado(s); setMostrarForm(true); }}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition"
              >
                Agendar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DEL FORMULARIO */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold mb-1">Tus Datos</h2>
            <p className="text-gray-500 text-sm mb-6 uppercase font-bold tracking-tight">
              Reservando: {servicioSeleccionado?.nombre}
            </p>

            <form onSubmit={procesarAgenda} className="space-y-4">
              <input 
                required 
                type="text" 
                placeholder="Nombre completo" 
                className="w-full border-gray-200 border p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <input 
                required 
                type="email" 
                placeholder="Email (para confirmación)" 
                className="w-full border-gray-200 border p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input 
                required 
                type="tel" 
                placeholder="Teléfono/WhatsApp (+569...)" 
                className="w-full border-gray-200 border p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setMostrarForm(false)} 
                  className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}