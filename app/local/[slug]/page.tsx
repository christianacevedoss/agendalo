'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '../../../lib/supabase'

interface Local {
  nombre: string;
  foto_banner: string;
  google_maps_url?: string;
  telefono?: string;
  direccion?: string; // Nueva columna
  descripcion?: string; // Nueva columna
}

interface Servicio {
  id: number;
  nombre: string;
  precio: number;
  imagen_url: string;
}

export default function PaginaLocal(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  
  const [local, setLocal] = useState<Local | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  
  const [mostrarForm, setMostrarForm] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null);
  const [metodoPago, setMetodoPago] = useState<'presencial' | 'online'>('presencial');

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');

  useEffect(() => {
    async function cargarDatos() {
      const { data: datosLocal } = await supabase.from('locales').select('*').eq('slug', params.slug).single();
      const { data: datosServicios } = await supabase.from('servicios').select('*').eq('local_slug', params.slug);
      if (datosLocal) setLocal(datosLocal as Local);
      if (datosServicios) setServicios(datosServicios as Servicio[]);
      setCargando(false);
    }
    cargarDatos();
  }, [params.slug]);

  const procesarAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicioSeleccionado) return;

    if (metodoPago === 'online') {
      window.location.href = "https://www.mercadopago.cl";
      return;
    }

    const { error } = await supabase.from('agendamientos').insert([{
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

  if (cargando) return <div className="p-20 text-center font-bold text-gray-400 uppercase">Cargando...</div>;
  if (!local) return <div className="p-20 text-center font-bold text-red-500">Local no encontrado</div>;

  return (
    <main className="min-h-screen bg-white font-sans text-gray-900">
      {/* Banner */}
      <div className="h-64 md:h-80 bg-blue-900 relative">
        <img src={local.foto_banner || 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200'} className="w-full h-full object-cover opacity-60" alt="Banner" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-4xl md:text-6xl font-black uppercase text-center px-4 drop-shadow-md">{local.nombre}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* INFO DEL LOCAL: Dirección, Teléfono y Descripción */}
        <div className="text-center mb-12">
          <p className="text-lg text-gray-600 italic mb-6 max-w-2xl mx-auto">
            "{local.descripcion || 'Bienvenidos a nuestro local, donde la calidad es nuestra prioridad.'}"
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {local.direccion && (
              <div className="flex items-center gap-2 bg-gray-100 text-gray-800 px-6 py-3 rounded-2xl font-semibold">
                📍 {local.direccion}
              </div>
            )}
            {local.telefono && (
              <a href={`tel:${local.telefono}`} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-6 py-3 rounded-2xl font-bold">
                📞 {local.telefono}
              </a>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-8 border-b pb-4">Nuestros Servicios</h2>
        <div className="grid gap-6">
          {servicios.map(s => (
            <div key={s.id} className="flex flex-col md:flex-row bg-white border border-gray-100 rounded-3xl overflow-hidden hover:border-blue-500 transition shadow-sm">
              <div className="w-full md:w-44 h-44">
                <img src={s.imagen_url} className="w-full h-full object-cover" alt={s.nombre} />
              </div>
              <div className="p-6 flex flex-1 items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{s.nombre}</h3>
                  <p className="text-blue-600 font-black text-2xl mt-1">${s.precio.toLocaleString('es-CL')}</p>
                </div>
                <button onClick={() => { setServicioSeleccionado(s); setMostrarForm(true); }} className="bg-black text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-600 transition">Agendar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE PAGO */}
      {mostrarForm && servicioSeleccionado && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl overflow-hidden w-full max-w-md shadow-2xl">
            <div className="p-6 bg-blue-600 text-white">
              <p className="text-xs uppercase font-black tracking-widest opacity-80 mb-1">Confirmación de Reserva</p>
              <h3 className="text-xl font-bold">Usted está agendando: {servicioSeleccionado.nombre}</h3>
            </div>

            <form onSubmit={procesarAgenda} className="p-8 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border">
                <span className="font-bold text-gray-500 uppercase text-xs">Valor del servicio</span>
                <span className="text-xl font-black text-blue-600">${servicioSeleccionado.precio.toLocaleString('es-CL')}</span>
              </div>

              <input required type="text" placeholder="Nombre completo" className="w-full border p-4 rounded-2xl outline-none" value={nombre} onChange={e => setNombre(e.target.value)} />
              <input required type="email" placeholder="Email" className="w-full border p-4 rounded-2xl outline-none" value={email} onChange={e => setEmail(e.target.value)} />
              <input required type="tel" placeholder="WhatsApp" className="w-full border p-4 rounded-2xl outline-none" value={telefono} onChange={e => setTelefono(e.target.value)} />

              <div className="pt-4">
                <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Seleccione método de pago</p>
                <div onClick={() => setMetodoPago(metodoPago === 'presencial' ? 'online' : 'presencial')} className={`p-4 border-2 rounded-2xl cursor-pointer transition ${metodoPago === 'online' ? 'border-green-500 bg-green-50' : 'border-gray-100'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">Pago Online (Dcto. Agéndalo)</span>
                    <span className="text-green-600 font-bold">-{Math.round(servicioSeleccionado.precio * 0.1).toLocaleString('es-CL')}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-6">
                <button type="button" onClick={() => setMostrarForm(false)} className="flex-1 bg-gray-100 py-4 rounded-2xl font-bold text-gray-500">Volver</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold">
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