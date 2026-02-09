'use client'

import { useState, useEffect } from 'react'
// VOLVEMOS A LA RUTA RELATIVA SEGURA:
import { supabase } from '../../../lib/supabase' 
import { useParams } from 'next/navigation'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths, 
  isBefore, 
  startOfDay,
  startOfWeek,
  endOfWeek
} from 'date-fns'
import { es } from 'date-fns/locale'

interface Local {
  nombre: string;
  foto_banner: string;
  maps_url?: string;
  telefono_local?: string;
  direccion?: string;
  descripcion?: string;
}

interface Servicio {
  id: number;
  nombre: string;
  precio: number;
  imagen_url: string;
}

// Eliminamos los tipos complejos de las props y usamos useParams
export default function PaginaLocal() {
  const params = useParams();
  // Validación de seguridad por si params es null
  const slug = params ? (params.slug as string) : '';

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
  const [telefonoInput, setTelefonoInput] = useState(''); 
  const [metodoPago, setMetodoPago] = useState<'presencial' | 'online'>('presencial');

  const horarios = ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00", "18:00"];

  useEffect(() => {
    if (!slug) return;

    async function cargar() {
      try {
        const { data: L, error: errorL } = await supabase.from('locales').select('*').eq('slug', slug).single();
        const { data: S, error: errorS } = await supabase.from('servicios').select('*').eq('local_slug', slug);
        
        if (errorL) console.error("Error cargando local:", errorL);
        
        if (L) setLocal(L as Local); 
        if (S) setServicios(S as Servicio[]);
      } catch (err) {
        console.error("Error general:", err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [slug]);

  useEffect(() => {
    if (diaSeleccionado && slug) {
      async function consultar() {
        const fechaFmt = format(diaSeleccionado as Date, 'yyyy-MM-dd');
        const { data } = await supabase.from('agendamientos').select('hora').eq('fecha', fechaFmt).eq('local', slug);
        setBloquesOcupados(data?.map(d => d.hora) || []);
      }
      consultar();
    }
  }, [diaSeleccionado, slug]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicioSeleccionado || !diaSeleccionado || !horaSeleccionada) return;

    if (telefonoInput.length !== 8) {
      alert("Por favor, ingresa los 8 dígitos de tu WhatsApp.");
      return;
    }

    if (metodoPago === 'online') {
      window.location.href = "https://www.mercadopago.cl"; 
      return;
    }

    const { error } = await supabase.from('agendamientos').insert([{
      cliente_nombre: nombre, 
      cliente_correo: email, 
      cliente_telefono: `+569${telefonoInput}`, 
      servicio_id: servicioSeleccionado.id, 
      local: slug,
      fecha: format(diaSeleccionado as Date, 'yyyy-MM-dd'), 
      hora: horaSeleccionada
    }]);
    
    if (error) {
      alert('Hubo un error al guardar. Inténtalo de nuevo.');
      console.error(error);
      return;
    }

    try {
      await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre,
          email: email,
          servicio: servicioSeleccionado.nombre,
          precio: servicioSeleccionado.precio.toLocaleString('es-CL'),
          fecha: format(diaSeleccionado as Date, "dd 'de' MMMM", { locale: es }),
          hora: horaSeleccionada,
          localNombre: local?.nombre || 'Local',
          telefonoLocal: local?.telefono_local || 'Contacto'
        })
      });
    } catch (err) {
      console.error("Error enviando correo:", err);
    }

    alert(`¡Listo ${nombre}! Tu hora ha sido agendada y te enviamos un correo de confirmación.`); 
    setMostrarForm(false); 
    setNombre(''); setEmail(''); setTelefonoInput('');
    setDiaSeleccionado(null); setHoraSeleccionada('');
  };

  const dias = eachDayOfInterval({ 
    start: startOfWeek(startOfMonth(mesActual), { weekStartsOn: 1 }), 
    end: endOfWeek(endOfMonth(mesActual), { weekStartsOn: 1 }) 
  });

  if (cargando) return <div className="min-h-screen flex items-center justify-center font-bold text-blue-600 animate-pulse uppercase tracking-widest">Cargando...</div>;
  if (!local) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500">Local no encontrado</div>;

  return (
    <main className="min-h-screen bg-white font-sans text-gray-900 pb-20">
      <div className="h-64 bg-blue-900 relative flex items-center justify-center text-white text-center">
        <img src={local.foto_banner} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="" />
        <h1 className="relative text-4xl md:text-6xl font-black uppercase tracking-tighter px-4 drop-shadow-lg">{local.nombre}</h1>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-12 -mt-10 relative z-10">
          <div className="bg-white shadow-xl rounded-3xl p-6 border border-gray-100 inline-block max-w-full">
            <p className="text-gray-500 italic mb-4">"{local.descripcion}"</p>
            <div className="flex flex-wrap justify-center gap-4">
              {local.maps_url && (
                <a href={local.maps_url} target="_blank" className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border hover:bg-blue-50 transition-colors cursor-pointer">
                  <span className="text-sm font-bold text-gray-700">📍 {local.direccion}</span>
                </a>
              )}
              {local.telefono_local && (
                <a href={`https://wa.me/${local.telefono_local.replace(/\D/g, '')}`} target="_blank" className="bg-[#25D366] text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-3 shadow-lg hover:scale-105 transition-transform">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp {local.telefono_local}
                </a>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-black mb-6 uppercase tracking-tight">Servicios</h2>
        <div className="grid gap-4">
          {servicios.map(s => (
            <div key={s.id} className="border-2 border-gray-50 p-6 rounded-[2rem] flex justify-between items-center bg-white shadow-sm hover:border-blue-500 transition-all group">
              <div>
                <h3 className="font-bold text-xl group-hover:text-blue-600 transition-colors">{s.nombre}</h3>
                <p className="text-blue-600 font-black text-2xl">${s.precio.toLocaleString('es-CL')}</p>
              </div>
              <button 
                onClick={() => { setServicioSeleccionado(s); setMostrarForm(true); }} 
                className="bg-black text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-600 transition shadow-md"
              >
                Agendar
              </button>
            </div>
          ))}
        </div>
      </div>

      {mostrarForm && servicioSeleccionado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row max-h-[90vh]">
            
            <div className="p-8 border-r bg-gray-50/50 md:w-1/2 overflow-y-auto">
              <div className="mb-6">
                <p className="text-blue-600 font-black uppercase text-[10px] tracking-widest mb-1">Paso 1</p>
                <h3 className="text-xl font-bold leading-tight tracking-tight text-gray-800">
                  Estás reservando tu hora para: <br/>
                  <span className="text-blue-600">{servicioSeleccionado.nombre} — ${servicioSeleccionado.precio.toLocaleString('es-CL')}</span>
                </h3>
              </div>
              
              <div className="bg-white p-6 rounded-3xl border mb-6 shadow-sm">
                <div className="flex justify-between items-center mb-4 text-sm font-bold">
                  <button type="button" onClick={() => setMesActual(subMonths(mesActual, 1))} className="p-2 hover:bg-gray-100 rounded-lg">◀</button>
                  <span className="capitalize">{format(mesActual, 'MMMM yyyy', { locale: es })}</span>
                  <button type="button" onClick={() => setMesActual(addMonths(mesActual, 1))} className="p-2 hover:bg-gray-100 rounded-lg">▶</button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['L','M','M','J','V','S','D'].map(d => <div key={d} className="text-[10px] font-bold text-gray-300 py-1">{d}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {dias.map(dia => {
                    const esPasado = isBefore(dia, startOfDay(new Date()));
                    const enMesActual = dia.getMonth() === mesActual.getMonth();
                    const sel = diaSeleccionado && isSameDay(dia, diaSeleccionado);
                    return (
                      <button 
                        key={dia.toString()} 
                        type="button" 
                        disabled={esPasado || !enMesActual} 
                        onClick={() => {setDiaSeleccionado(dia); setHoraSeleccionada('');}}
                        className={`h-9 w-9 rounded-xl text-xs font-bold transition-all ${
                          !enMesActual ? 'opacity-0 pointer-events-none' :
                          esPasado ? 'text-gray-200' : 
                          sel ? 'bg-blue-600 text-white shadow-md scale-110' : 'hover:bg-blue-50 text-gray-700'
                        }`}
                      >
                        {format(dia, 'd')}
                      </button>
                    )
                  })}
                </div>
              </div>

              {diaSeleccionado && (
                <div className="grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-2">
                  {horarios.map(h => (
                    <button key={h} type="button" disabled={bloquesOcupados.includes(h)} onClick={() => setHoraSeleccionada(h)}
                      className={`p-2 rounded-xl text-[10px] font-black border transition-all ${
                        bloquesOcupados.includes(h) 
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed decoration-slice line-through' 
                          : horaSeleccionada === h 
                            ? 'bg-black text-white shadow-lg transform scale-105' 
                            : 'bg-white border-gray-100 hover:border-blue-500 hover:text-blue-600'
                      }`}>
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8 md:w-1/2 flex flex-col justify-center bg-white overflow-y-auto">
              {!horaSeleccionada ? (
                <div className="text-center py-20 text-gray-400 font-bold italic text-xs uppercase tracking-widest opacity-50 select-none">
                  Selecciona una fecha y hora <br/> para continuar...
                </div>
              ) : (
                <form onSubmit={enviar} className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                  <div className="bg-green-50 p-5 rounded-2xl border border-green-100 mb-2 shadow-sm">
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Tu cita</p>
                    <p className="font-bold text-green-900 leading-tight">
                      {format(diaSeleccionado as Date, "eeee dd 'de' MMMM", {locale: es})} <br/>
                      a las {horaSeleccionada} hrs
                    </p>
                  </div>
                  
                  <input required placeholder="Nombre Completo" className="w-full border p-4 rounded-2xl outline-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium" value={nombre} onChange={e => setNombre(e.target.value)} />
                  <input required type="email" placeholder="Correo Electrónico" className="w-full border p-4 rounded-2xl outline-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium" value={email} onChange={e => setEmail(e.target.value)} />
                  
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm select-none group-focus-within:text-blue-500 transition-colors">+56 9</span>
                    <input 
                      required 
                      type="tel" 
                      maxLength={8}
                      placeholder="1234 5678" 
                      className="w-full border p-4 pl-16 rounded-2xl outline-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold tracking-widest transition-all" 
                      value={telefonoInput} 
                      onChange={e => setTelefonoInput(e.target.value.replace(/\D/g, ''))} 
                    />
                  </div>

                  <div onClick={() => setMetodoPago(metodoPago === 'presencial' ? 'online' : 'presencial')} className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${metodoPago === 'online' ? 'border-green-500 bg-green-50 shadow-inner' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className={metodoPago === 'online' ? 'text-green-700' : 'text-gray-400'}>Pago Online (-10%)</span>
                      <span className="text-green-600 text-sm">-${Math.round(servicioSeleccionado.precio * 0.1).toLocaleString('es-CL')}</span>
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm">
                    {metodoPago === 'online' ? 'Ir a Pagar' : 'Confirmar Agenda'}
                  </button>
                  
                  <button type="button" onClick={() => setMostrarForm(false)} className="w-full text-gray-400 text-[10px] font-black pt-4 uppercase tracking-[0.2em] text-center hover:text-red-500 transition-colors">
                    Cancelar
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}