'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '../../../lib/supabase'

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
  const params = use(props.params);
  
  const [local, setLocal] = useState<Local | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null);
  
  // Estados para el formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [metodoPago, setMetodoPago] = useState('presencial'); // 'presencial' o 'online'

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

    // Si elige pago online, redirigimos (por ahora es una simulación)
    if (metodoPago === 'online') {
      alert('Redirigiendo a pasarela de pago con descuento aplicado...');
      window.location.href = "https://www.mercadopago.cl"; // Ejemplo de link futuro
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

  if (cargando) return <div className="p-20 text-center font-bold">Cargando...</div>;
  if (!local) return <div className="p-20 text-center font-bold">Local no encontrado</div>;

  return (
    <main className="min-h-screen bg-white font-sans">
      {/* Banner y Header que ya tenías */}
      <div className="h-64 md:h-80 bg-gray-900 relative">
        <img src={local.foto_banner} className="w-full h-full object-cover opacity-60" alt="Banner" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-4xl md:text-6xl font-black uppercase tracking-tighter text-center px-4">{local.nombre}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-8 text-gray-800 border-b pb-4">Servicios</h2>
        <div className="grid gap-6">
          {servicios.map(s => (
            <div key={s.id} className="flex flex-col md:flex-row bg-white border border-gray-100 rounded-3xl overflow-hidden hover:border-blue-500 transition shadow-sm">
              <div className="w-full md:w-44 h-44">
                <img src={s.imagen_url} className="w-full h-full object-cover" alt={s.nombre} />
              </div>
              <div className="p-6 flex flex-1 items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{s.nombre}</h3>
                  <p className="text-blue-600 font-black text-2xl">${s.precio.toLocaleString('es-CL')}</p>
                </div>
                <button onClick={() => { setServicioSeleccionado(s); setMostrarForm(true); }} className="bg-black text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-600 transition">Agendar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- FORMULARIO CON PRECIO Y OPCIÓN DE PAGO --- */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl overflow-hidden w-full max-w-md shadow-2xl">
            <div className="p-6 bg-gray-50 border-b flex items-center gap-4">
              <img src={servicioSeleccionado?.imagen_url} className="w-16 h-16 rounded-xl object-cover" alt="S" />
              <div>
                <h3 className="font-bold text-lg">{servicioSeleccionado?.nombre}</h3>
                <p className="text-blue-600 font-black text-xl">${servicioSeleccionado?.precio.toLocaleString('es-CL')}</p>
              </div>
            </div>

            <form onSubmit={procesarAgenda} className="p-8 space-y-4">
              <input required type="text" placeholder="Nombre" className="w-full border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" value={nombre} onChange={e => setNombre(e.target.value)} />
              <input required type="email" placeholder="Email" className="w-full border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" value={email} onChange={e => setEmail(e.target.value)} />
              <input required type="tel" placeholder="WhatsApp" className="w-full border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" value={telefono} onChange={e => setTelefono(e.target.value)} />

              {/* OPCIONES DE PAGO */}
              <div className="pt-4">
                <p className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Método de Pago</p>
                <div className="grid grid-cols-1 gap-2">
                  <label className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition ${metodoPago === 'presencial' ? 'border-blue-600 bg-blue-50' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="pago" value="presencial" checked={metodoPago === 'presencial'} onChange={() => setMetodoPago('presencial')} className="hidden" />
                      <span className="font-bold text-sm">Pago en el local</span>
                    </div>
                    <span className="text-xs font-bold text-gray-400">Precio normal</span>
                  </label>
                  
                  <label className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition ${metodoPago === 'online' ? 'border-green-600 bg-green-50' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="pago" value="online" checked={metodoPago === 'online'} onChange={() => setMetodoPago('online')} className="hidden" />
                      <span className="font-bold text-sm">Pago Online (Dcto. Agéndalo)</span>
                    </div>
                    <span className="text-xs font-bold text-green-600">-{ (servicioSeleccionado?.precio || 0) * 0.1 }</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-6">
                <button type="button" onClick={() => setMostrarForm(false)} className="flex-1 bg-gray-100 py-4 rounded-2xl font-bold text-gray-500">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200">
                  {metodoPago === 'online' ? 'Pagar ahora' : 'Confirmar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}