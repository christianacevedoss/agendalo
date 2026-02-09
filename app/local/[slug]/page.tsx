'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '../../../lib/supabase'

export default function PaginaLocal(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  
  const [local, setLocal] = useState<any>(null);
  const [servicios, setServicios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<any>(null);
  
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');

  useEffect(() => {
    async function cargarDatos() {
      const { data: datosLocal } = await supabase
        .from('locales')
        .select('*')
        .eq('slug', params.slug)
        .single();

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

  const procesarAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
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

  if (cargando) return <div className="p-20 text-center font-bold">Cargando...</div>;

  return (
    <main className="min-h-screen bg-white">
      {/* Banner del Local */}
      <div className="h-64 md:h-80 bg-gray-900 relative">
        <img 
          src={local?.foto_banner || 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200'} 
          className="w-full h-full object-cover opacity-60" 
          alt="Banner" 
        />
      </div>

      {/* --- SECCIÓN DE TÍTULO E INFORMACIÓN DEL LOCAL --- */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="text-center mb-12">
          {/* Título Principal */}
          <h1 className="text-5xl font-black uppercase tracking-tighter text-gray-900 mb-4">
            {local?.nombre}
          </h1>
          <div className="h-1.5 w-24 bg-blue-600 mx-auto rounded-full mb-6"></div>
          
          {/* Botones de Acción (Mapa y Teléfono) */}
          <div className="flex flex-wrap justify-center gap-4">
            {local?.google_maps_url && (
              <a 
                href={local.google_maps_url} 
                target="_blank" 
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-2xl font-bold transition"
              >
                <span>📍</span> Cómo llegar
              </a>
            )}
            {local?.telefono && (
              <a 
                href={`tel:${local.telefono}`} 
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-5 py-2.5 rounded-2xl font-bold transition"
              >
                <span>📞</span> {local.telefono}
              </a>
            )}
          </div>
        </div>

        {/* --- LISTADO DE SERVICIOS --- */}
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Nuestros Servicios</h2>
        <div className="grid gap-6">
          {servicios.map(s => (
            <div key={s.id} className="flex flex-col md:flex-row bg-white border border-gray-100 rounded-3xl overflow-hidden hover:border-blue-500 transition shadow-sm hover:shadow-md">
              <div className="w-full md:w-44 h-44">
                <img src={s.imagen_url} className="w-full h-full object-cover" alt={s.nombre} />
              </div>
              <div className="p-6 flex flex-1 items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{s.nombre}</h3>
                  <p className="text-blue-600 font-black text-2xl">${s.precio.toLocaleString('es-CL')}</p>
                </div>
                <button 
                  onClick={() => { setServicioSeleccionado(s); setMostrarForm(true); }}
                  className="bg-black text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-600 transition shadow-lg shadow-gray-200"
                >
                  Agendar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formulario de Agenda (Modal) */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl overflow-hidden w-full max-w-md shadow-2xl">
            <div className="h-32 relative">
              <img src={servicioSeleccionado?.imagen_url} className="w-full h-full object-cover" alt="Servicio" />
              <div className="absolute inset-0 bg-black/40 flex items-center p-6">
                <h3 className="text-white font-bold text-xl uppercase leading-tight">Agendar {servicioSeleccionado?.nombre}</h3>
              </div>
            </div>
            <form onSubmit={procesarAgenda} className="p-8 space-y-4">
              <input required type="text" placeholder="Tu nombre" className="w-full border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" value={nombre} onChange={e => setNombre(e.target.value)} />
              <input required type="email" placeholder="Correo electrónico" className="w-full border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" value={email} onChange={e => setEmail(e.target.value)} />
              <input required type="tel" placeholder="WhatsApp (+569...)" className="w-full border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" value={telefono} onChange={e => setTelefono(e.target.value)} />
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setMostrarForm(false)} className="flex-1 bg-gray-100 py-4 rounded-2xl font-bold text-gray-500">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}