'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '../../../lib/supabase'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  isBefore,
  startOfDay
} from 'date-fns'
import { es } from 'date-fns/locale'

// Interfaces para TypeScript
interface Local {
  nombre: string;
  foto_banner: string;
  google_maps_url?: string;
  telefono?: string;
  direccion?: string;
  descripcion?: string;
}

interface Servicio {
  id: number;
  nombre: string;
  precio: number;
  imagen_url: string;
}

export default function PaginaLocal(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  
  // Estados de datos
  const [local, setLocal] = useState<Local | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Estados del flujo de reserva
  const [mostrarForm, setMostrarForm] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null);
  const [metodoPago, setMetodoPago] = useState<'presencial' | 'online'>('presencial');

  // Estados del Calendario y Horas
  const [mesActual, setMesActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string>('');
  const [bloquesOcupados, setBloquesOcupados] = useState<string[]>([]);

  // Datos del Cliente
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');

  // Bloques de horario definidos (puedes cambiarlos según el local)
  const horariosBase = ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00", "18:00"];

  // 1. Cargar Local y Servicios
  useEffect(() => {
    async function cargarDatos() {
      const { data: L } = await supabase.from('locales').select('*').eq('slug', params.slug).single();
      const { data: S } = await supabase.from('servicios').select('*').eq('local_slug', params.slug);
      if (L) setLocal(L as Local);
      if (S) setServicios(S as Servicio[]);
      setCargando(false);
    }
    cargarDatos();
  }, [params.slug]);

  // 2. Cargar disponibilidad cuando cambia el día seleccionado
  useEffect(() => {
    if (diaSeleccionado) {
      async function consultarOcupados() {
        const fechaFmt = format(diaSeleccionado!, 'yyyy-MM-dd');
        const { data } = await supabase
          .from('agendamientos')
          .select('hora')
          .eq('fecha', fechaFmt)
          .eq('local', params.slug); // Usamos tu variable 'local'
        
        if (data) setBloquesOcupados(data.map(d => d.hora));
        else setBloquesOcupados([]);
      }
      consultarOcupados();
    }
  }, [diaSeleccionado, params.slug]);

  const manejarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicioSeleccionado || !diaSeleccionado || !horaSeleccionada) return;

    if (metodoPago === 'online') {
      window.location.href = "https://www.mercadopago.cl";
      return;
    }

    const { error } = await supabase.from('agendamientos').insert([{
      cliente_nombre: nombre,
      cliente_email: email,
      cliente_telefono: telefono,
      servicio_id: servicioSeleccionado.id,
      local: params.slug,
      fecha: format(diaSeleccionado, 'yyyy-MM-dd'),
      hora: horaSeleccionada,
      fecha_hora: new Date().toISOString()
    }]);

    if (!error) {
      alert('¡Cita agendada con éxito!');
      setMostrarForm(false);
      setDiaSeleccionado(null);
      setHoraSeleccionada('');
    }
  };

  // Generar días del mes para el calendario
  const diasMes = eachDayOfInterval({
    start: startOfMonth(mesActual),
    end: endOfMonth(mesActual),
  });

  if (cargando) return <div className="p-20 text-center font-bold text-gray-400 uppercase tracking-widest">Cargando...</div>;
  if (!local) return <div className="p-20 text-center font-bold text-red-500">Local no encontrado</div>;

  return (
    <main className="min-h-screen bg-white font-sans text-gray-900 pb-20">
      {/* BANNER */}
      <div className="h-64 bg-blue-900 relative">
        <img src={local.foto_banner} className="w-full h-full object-cover opacity-60" alt="Banner" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-4xl md:text-6xl font-black uppercase text-center px-4">{local.nombre}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* INFO LOCAL */}
        <div className="text-center mb-12">
          <p className="text-lg text-gray-500 italic mb-8">"{local.descripcion}"</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="bg-gray-50 p-3 px-6 rounded-2xl border flex items-center gap-3">
              <span className="font-medium text-gray-700">📍 {local.direccion}</span>
              {local.google_maps_url && (
                <a href={local.google_maps_url} target="_blank" className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-xl font-bold">Cómo llegar</a>
              )}
            </div>
            {local.telefono && (
              <a href={`tel:${local.telefono}`} className="bg-blue-50 text-blue-700 p-3 px-6 rounded-2xl font-bold">📞 {local.telefono}</a>
            )}
          </div>
        </div>

        {/* LISTA SERVICIOS */}
        <h2 className="text-2xl font-bold mb-6 border-b pb-4">Servicios</h2>
        <div className="grid gap-4">
          {servicios.map(s => (
            <div key={s.id} className="flex bg-white border rounded-3xl overflow-hidden hover:border-blue-500 transition shadow-sm">
              <img src={s.imagen_url} className="w-32 h-32 object-cover" alt={s.nombre} />
              <div className="p-6 flex-1 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{s.nombre}</h3>
                  <p className="text-blue-600 font-black">${s.precio.toLocaleString('es-CL')}</p>
                </div>
                <button 
                  onClick={() => { setServicioSeleccionado(s); setMostrarForm(true); }}
                  className="bg-black text-white px-6 py-2.5 rounded-2xl font-bold"
                >
                  Agendar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE AGENDAMIENTO COMPLETO */}
      {mostrarForm && servicioSeleccionado && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] overflow-hidden w-full max-w-md shadow-2xl my-8">
            <div className="p-6 bg-blue-600 text-white">
              <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Paso a paso</p>
              <h3 className="text-xl font-bold leading-tight">Usted está agendando: {servicioSeleccionado.nombre}</h3>
            </div>

            <div className="p-8 space-y-8">
              {/* 1. CALENDARIO */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => setMesActual(subMonths(mesActual, 1))} className="text-blue-600 font-bold">◀</button>
                  <span className="font-bold capitalize">{format(mesActual, 'MMMM yyyy', { locale: es })}</span>
                  <button onClick={() => setMesActual(addMonths(mesActual, 1))} className="text-blue-600 font-bold">▶</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['D','L','M','M','J','V','S'].map(d => <div key={d} className="text-[10px] font-bold text-gray-400">{d}</div>)}
                  {diasMes.map(dia => {
                    const hoy = startOfDay(new Date());
                    const esPasado = isBefore(dia, hoy);
                    const seleccionado = diaSeleccionado && isSameDay(dia, diaSeleccionado);
                    return (
                      <button 
                        key={dia.toString()}
                        disabled={esPasado}
                        onClick={() => { setDiaSeleccionado(dia); setHoraSeleccionada(''); }}
                        className={`h-9 w-9 rounded-xl text-xs font-bold transition-all ${
                          esPasado ? 'text-gray-200 cursor-not-allowed' :
                          seleccionado ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-gray-700'
                        }`}
                      >
                        {format(dia, 'd')}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 2. BLOQUES DE HORA */}
              {diaSeleccionado && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">Horas para el {format(diaSeleccionado, "dd 'de' MMMM", { locale: es })}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {horariosBase.map(h => {
                      const ocupado = bloquesOcupados.includes(h);
                      const sel = horaSeleccionada === h;
                      return (
                        <button
                          key={h}
                          disabled={ocupado}
                          onClick={() => setHoraSeleccionada(h)}
                          className={`p-2 rounded-xl text-[11px] font-bold border transition-all ${
                            ocupado ? 'bg-gray-50 text-gray-200 border-gray-50' :
                            sel ? 'bg-black text-white border-black' : 'bg-white text-gray-800 hover:border-blue-500'
                          }`}
                        >
                          {h}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 3. FORMULARIO FINAL */}
              {horaSeleccionada && (
                <form onSubmit={manejarReserva} className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="h-px bg-gray-100 my-6"></div>
                  <input required type="text" placeholder="Tu nombre" className="w-full border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" value={nombre} onChange={e => setNombre(e.target.value)} />
                  <input required type="tel" placeholder="WhatsApp" className="w-full border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" value={telefono} onChange={e => setTelefono(e.target.value)} />
                  
                  {/* Selector Pago Online */}
                  <div onClick={() => setMetodoPago(metodoPago === 'presencial' ? 'online' : 'presencial')} className={`p-4 border-2 rounded-2xl cursor-pointer transition ${metodoPago === 'online' ? 'border-green-500 bg-green-50' : 'border-gray-100'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs uppercase tracking-tight">Pago Online (Dcto Agéndalo)</span>
                      <span className="text-green-600 font-black text-sm">-${Math.round(servicioSeleccionado.precio * 0.1).toLocaleString('es-CL')}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button type="button" onClick={() => setMostrarForm(false)} className="flex-1 bg-gray-100 py-4 rounded-2xl font-bold text-gray-500">Volver</button>
                    <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold">
                      {metodoPago === 'online' ? 'Ir a pagar' : 'Confirmar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}