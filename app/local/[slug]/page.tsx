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
  
  const [local, setLocal] = useState<Local | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null);
  
  const [mesActual, setMesActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [bloquesOcupados, setBloquesOcupados] = useState<string[]>([]);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState(''); 
  const [telefono, setTelefono] = useState('');
  const [metodoPago, setMetodoPago] = useState<'presencial' | 'online'>('presencial');

  const horarios = ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00", "18:00"];

  useEffect(() => {
    async function cargar() {
      const { data: L } = await supabase.from('locales').select('*').eq('slug', params.slug).single();
      const { data: S } = await supabase.from('servicios').select('*').eq('local_slug', params.slug);
      if (L) setLocal(L as Local); 
      if (S) setServicios(S as Servicio[]);
      setCargando(false);
    }
    cargar();
  }, [params.slug]);

  useEffect(() => {
    if (diaSeleccionado) {
      async function consultar() {
        const fechaFmt = format(diaSeleccionado as Date, 'yyyy-MM-dd');
        const { data } = await supabase.from('agendamientos').select('hora').eq('fecha', fechaFmt).eq('local', params.slug);
        setBloquesOcupados(data?.map(d => d.hora) || []);
      }
      consultar();
    }
  }, [diaSeleccionado, params.slug]);

  // Cálculo de precios
  const descuento = servicioSeleccionado ? Math.round(servicioSeleccionado.precio * 0.1) : 0;
  const precioFinal = servicioSeleccionado ? (metodoPago === 'online' ? servicioSeleccionado.precio - descuento : servicioSeleccionado.precio) : 0;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicioSeleccionado || !diaSeleccionado || !horaSeleccionada) return;

    // Si es pago online, redirigimos
    if (metodoPago === 'online') {
      window.location.href = "https://www.mercadopago.cl"; // Aquí pondrás tu link de pago real después
      return;
    }

    // Si es presencial, guardamos
    const { error } = await supabase.from('agendamientos').insert([{
      cliente_nombre: nombre, 
      cliente_email: email, 
      cliente_telefono: telefono,
      servicio_id: servicioSeleccionado.id, 
      local: params.slug,
      fecha: format(diaSeleccionado, 'yyyy-MM-dd'), 
      hora: horaSeleccionada
    }]);
    
    if (!error) { 
      alert('¡Agendado con éxito!'); 
      setMostrarForm(false); 
      setDiaSeleccionado(null); setHoraSeleccionada('');
    }
  };

  const dias = eachDayOfInterval({ start: startOfMonth(mesActual), end: endOfMonth(mesActual) });

  if (cargando) return <div className="p-20 text-center font-bold">Cargando...</div>;
  if (!local) return <div className="p-20 text-center font-bold text-red-500">Local no encontrado</div>;

  return (
    <main className="min-h-screen bg-white font-sans text-gray-900 pb-20">
      <div className="h-64 bg-blue-900 relative flex items-center justify-center text-white">
        <img src={local.foto_banner} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="" />
        <h1 className="relative text-4xl md:text-6xl font-black uppercase tracking-tighter">{local.nombre}</h1>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-12 -mt-10 relative z-10">
          <div className="bg-white shadow-xl rounded-3xl p-6 border border-gray-100 inline-block max-w-full">
            <p className="text-gray-500 italic mb-4">"{local.descripcion}"</p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border">
                <span className="text-sm font-bold text-gray-700">📍 {local.direccion}</span>
                {local.google_maps_url && (
                  <a href={local.google_maps_url} target="_blank" className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded-lg font-black uppercase">Ver Mapa</a>
                )}
              </div>
              <a href={`tel:${local.telefono}`} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold text-sm">📞 {local.telefono}</a>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-black mb-6 uppercase">Servicios</h2>
        <div className="grid gap-4">
          {servicios.map(s => (
            <div key={s.id} className="border-2 border-gray-50 p-6 rounded-[2rem] flex justify-between items-center bg-white shadow-sm">
              <div>
                <h3 className="font-bold text-xl">{s.nombre}</h3>
                <p className="text-blue-600 font-black text-2xl">${s.precio.toLocaleString('es-CL')}</p>
              </div>
              <button onClick={() => { setServicioSeleccionado(s); setMostrarForm(true); }} className="bg-black text-white px-8 py-3 rounded-2xl font-bold">Agendar</button>
            </div>
          ))}
        </div>
      </div>

      {mostrarForm && servicioSeleccionado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row max-h-[90vh]">
            
            {/* IZQUIERDA: CALENDARIO */}
            <div className="p-8 border-r bg-gray-50/50 md:w-1/2 overflow-y-auto">
              <div className="mb-6">
                <p className="text-blue-600 font-black uppercase text-xs mb-1">Paso 1</p>
                {/* Agregado el valor del servicio aquí */}
                <h3 className="text-xl font-bold leading-tight">Usted está agendando: <br/><span className="text-blue-600">{servicioSeleccionado.nombre} — ${servicioSeleccionado.precio.toLocaleString('es-CL')}</span></h3>
              </div>
              
              <div className="bg-white p-6 rounded-3xl border mb-6 shadow-sm">
                <div className="flex justify-between items-center mb-4 text-sm font-bold">
                  <button type="button" onClick={() => setMesActual(subMonths(mesActual, 1))}>◀</button>
                  <span className="capitalize">{format(mesActual, 'MMMM yyyy', { locale: es })}</span>
                  <button type="button" onClick={() => setMesActual(addMonths(mesActual, 1))}>▶</button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {['D','L','M','M','J','V','S'].map(d => <div key={d} className="text-center text-[10px] font-bold text-gray-300">{d}</div>)}
                  {dias.map(dia => {
                    const esPasado = isBefore(dia, startOfDay(new Date()));
                    const sel = diaSeleccionado && isSameDay(dia, diaSeleccionado);
                    return (
                      <button key={dia.toString()} type="button" disabled={esPasado} onClick={() => {setDiaSeleccionado(dia); setHoraSeleccionada('');}}
                        className={`h-9 w-9 rounded-xl text-xs font-bold transition ${esPasado ? 'text-gray-200 cursor-not-allowed' : sel ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'hover:bg-blue-50 text-gray-700'}`}>
                        {format(dia, 'd')}
                      </button>
                    )
                  })}
                </div>
              </div>

              {diaSeleccionado && (
                <div className="grid grid-cols-4 gap-2 animate-in fade-in zoom-in duration-300">
                  {horarios.map(h => (
                    <button key={h} type="button" disabled={bloquesOcupados.includes(h)} onClick={() => setHoraSeleccionada(h)}
                      className={`p-2 rounded-xl text-[10px] font-black border transition-all ${bloquesOcupados.includes(h) ? 'bg-gray-50 text-gray-200' : horaSeleccionada === h ? 'bg-black text-white' : 'bg-white border-gray-100 hover:border-blue-500'}`}>
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DERECHA: FORMULARIO */}
            <div className="p-8 md:w-1/2 flex flex-col justify-center bg-white overflow-y-auto">
              {!horaSeleccionada ? (
                <div className="text-center py-20 text-gray-400 font-bold italic">Seleccione fecha y hora para continuar...</div>
              ) : (
                <form onSubmit={enviar} className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                  <div className="bg-green-50 p-5 rounded-2xl border border-green-100 mb-2">
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Tu selección</p>
                    <p className="font-bold text-green-900 leading-tight">
                      {format(diaSeleccionado as Date, "eeee dd 'de' MMMM", {locale: es})} <br/>
                      a las {horaSeleccionada} hrs
                    </p>
                  </div>
                  
                  <input required placeholder="Nombre Completo" className="w-full border p-4 rounded-2xl outline-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500" value={nombre} onChange={e => setNombre(e.target.value)} />
                  <input required type="email" placeholder="Correo Electrónico" className="w-full border p-4 rounded-2xl outline-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500" value={email} onChange={e => setEmail(e.target.value)} />
                  <input required type="tel" placeholder="WhatsApp" className="w-full border p-4 rounded-2xl outline-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500" value={telefono} onChange={e => setTelefono(e.target.value)} />

                  <div onClick={() => setMetodoPago(metodoPago === 'presencial' ? 'online' : 'presencial')} className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${metodoPago === 'online' ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-blue-100'}`}>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className={metodoPago === 'online' ? 'text-green-700' : 'text-gray-400'}>Pago Online (-10%)</span>
                      <span className="text-green-600 text-sm">-${descuento.toLocaleString('es-CL')}</span>
                    </div>
                  </div>

                  {/* Botón dinámico */}
                  <button type="submit" className={`w-full py-5 rounded-2xl font-black shadow-xl transition-all hover:scale-[1.02] ${metodoPago === 'online' ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-100' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'}`}>
                    {metodoPago === 'online' ? `IR A PAGAR $${precioFinal.toLocaleString('es-CL')}` : 'CONFIRMAR AGENDA'}
                  </button>
                  <button type="button" onClick={() => setMostrarForm(false)} className="w-full text-gray-400 text-xs font-bold pt-2 uppercase tracking-widest">Cancelar</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}