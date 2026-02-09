'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '../../../lib/supabase'

// 1. Interfaces estrictas para que el Build sepa qué datos esperar
interface Local {
  nombre: string;
  foto_banner: string;
  google_maps_url?: string;
  telefono?: string;
}

interface Servicio {
  id: number;
  nombre: string;
  precio: number;
  imagen_url: string;
}

export default function PaginaLocal(props: { params: Promise<{ slug: string }> }) {
  // Desenvolvemos el slug de la URL de forma segura para Next.js 15
  const params = use(props.params);
  
  // Estados con tipado para evitar errores de "undefined"
  const [local, setLocal] = useState<Local | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Estados para el flujo de la agenda
  const [mostrarForm, setMostrarForm] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null);
  const [metodoPago, setMetodoPago] = useState<'presencial' | 'online'>('presencial');

  // Datos del cliente
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');

  useEffect(() => {
    async function cargarDatos() {
      // Consulta al local y sus servicios en Talca
      const { data: datosLocal } = await supabase
        .from('locales')
        .select('*')
        .eq('slug', params.slug)
        .single();

      const { data: datosServicios } = await supabase
        .from('servicios')
        .select('*')
        .eq('local_slug', params.slug);

      if (datosLocal) setLocal(datosLocal as Local);
      if (datosServicios) setServicios(datosServicios as Servicio[]);
      setCargando(false);
    }
    cargarDatos();
  }, [params.slug]);

  const procesarAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicioSeleccionado) return;

    // Lógica para el futuro link de pago
    if (metodoPago === 'online') {
      alert('Redirigiendo a pago online con descuento...');
      window.location.href = "https://www.mercadopago.cl";
      return;
    }

    // Guardamos la reserva en la tabla agendamientos
    const { error } = await supabase
      .from('agendamientos')
      .insert([{
        cliente_nombre: nombre,
        cliente_email: email,
        cliente_telefono: telefono,
        servicio_id: servicioSeleccionado.id,
        fecha_hora: new Date().toISOString()
      }]);

    if (!error) {
      alert('¡Cita agendada con éxito!');
      setMostrarForm(false);
      setNombre(''); setEmail(''); setTelefono('');
    }
  };

  // Pantalla de carga profesional
  if (cargando) return <div className="p-20 text-center font-bold text-gray-400 uppercase">Cargando local...</div>;
  
  // Guardia de seguridad: Si el local no existe en Supabase, no rompemos el sitio
  if (!local) return <div className="p-20 text-center font-bold text-red-500">Local no encontrado</div>;

  return (
    <main className="min-h-screen bg-white font-sans text-gray-900">
      {/* Banner con respaldo si no hay imagen */}
      <div className="h-64 md:h-80 bg-blue-900 relative">
        <img 
          src={local.foto_banner || 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200'} 
          className="w-full h-full object-cover opacity-60" 
          alt="Banner" 
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-4xl md:text-6xl font-black uppercase text-center px-4 drop-shadow-md">
            {local.nombre}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Botones de interacción rápida */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {local.google_maps_url && (
            <a href={local.google_maps_url} target="_blank" className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-2xl font-bold transition">
              📍 Cómo llegar
            </a>
          )}
          {local.telefono && (
            <a href={`tel:${local.telefono}`} className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-6 py-3 rounded-2xl font-bold transition">
              📞 {local.telefono}
            </a>
          )}
        </div>

        <h2 className="text-2xl font-bold mb-8 border-b pb-4">Nuestros Servicios</h2>
        
        <div className="grid gap-6">
          {servicios.map(s => (
            <div key={s.id} className="flex flex-col md:flex-row bg-white border border-gray-100 rounded-3xl overflow-hidden hover:border-blue-500 transition shadow-sm hover:shadow-md">
              <div className="w-full md:w-44 h-44">
                <img src={s.imagen_url} className="w-full h-full object-cover" alt={s.nombre} />
              </div>
              <div className="p-6 flex flex-1 items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{s.nombre}</h3>
                  <p className="text-blue-600 font-black text-2xl mt-1">
                    ${s.precio.toLocaleString('es-CL')}
                  </p>
                </div>
                <button 
                  onClick={() => { setServicioSeleccionado(s); setMostrarForm(true); }}
                  className="bg-black text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-600 transition"
                >
                  Agendar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Reserva con Resumen de Pago */}
      {mostrarForm && servicioSeleccionado && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl overflow-hidden w-full max-w-md shadow-2xl">
            <div className="p-6 bg-gray-50 border-b flex items-center gap-4">
              <img src={servicioSeleccionado.imagen_url} className="w-16 h-16 rounded-xl object-cover shadow-sm" alt="S" />
              <div>
                <h3 className="font-bold text-lg leading-tight">{servicioSeleccionado.nombre}</h3>
                <p className="text-blue-600 font-black text-xl">
                  ${servicioSeleccionado.precio.toLocaleString('es-CL')}
                </p>
              </div>
            </div>

            <form onSubmit={procesarAgenda} className="p-8 space-y-4">
              <input required type="text" placeholder="Tu nombre" className="w-full border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" value={nombre} onChange={e => setNombre(e.target.value)} />
              <input required type="email" placeholder="Email" className="w-full border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" value={email} onChange={e => setEmail(e.target.value)} />
              <input required type="tel" placeholder="WhatsApp (+569...)" className="w-full border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" value={telefono} onChange={e => setTelefono(e.target.value)} />

              {/* Selector de Pago Online con Descuento */}
              <div className="pt-4">
                <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Método de pago</p>
                <div 
                  onClick={() => setMetodoPago(metodoPago === 'presencial' ? 'online' : 'presencial')}
                  className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${metodoPago === 'online' ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-blue-200'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">Pago Online (Dcto. Agéndalo)</span>
                    <span className="text-green-600 font-bold">
                      -{Math.round(servicioSeleccionado.precio * 0.1).toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-6">
                <button type="button" onClick={() => setMostrarForm(false)} className="flex-1 bg-gray-100 py-4 rounded-2xl font-bold text-gray-500">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200">
                  {metodoPago === 'online' ? 'Ir a pagar' : 'Confirmar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}