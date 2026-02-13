'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase' 
import { useParams } from 'next/navigation'
import Link from 'next/link' 
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
  estado: string; 
}

interface Servicio {
  id: number;
  nombre: string;
  precio: number;
  imagen_url: string;
}

export default function PaginaLocal() {
  const params = useParams();
  const slug = params ? (params.slug as string) : '';

  const [local, setLocal] = useState<Local | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  
  const [mostrarForm, setMostrarForm] = useState(false);
  const [reservaExitosa, setReservaExitosa] = useState(false);
  
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
        const { data: L } = await supabase.from('locales').select('*').eq('slug', slug).single();
        const { data: S } = await supabase.from('servicios').select('*').eq('local_slug', slug);
        
        if (L) {
            setLocal(L as Local);
            // --- CAMBIO AQUÍ: ACTUALIZAR EL TÍTULO DE LA PESTAÑA ---
            document.title = `${L.nombre} | Agendalo`; 
        }
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
      return;
    }
    
    setMostrarForm(false); 
    setReservaExitosa(true);
  };

  const cerrarTodo = () => {
    setReservaExitosa(false);
    setNombre(''); setEmail(''); setTelefonoInput('');
    setDiaSeleccionado(null); setHoraSeleccionada('');
  }

  const dias = eachDayOfInterval({ 
    start: startOfWeek(startOfMonth(mesActual), { weekStartsOn: 1 }), 
    end: endOfWeek(endOfMonth(mesActual), { weekStartsOn: 1 }) 
  });

  // -----------------------------------------------------------
  // PANTALLAS DE CARGA Y ERRORES
  // -----------------------------------------------------------

  if (cargando) return (
      <div className="min-h-screen flex items-center justify-center bg-white">
          <p className="font-bold text-blue-600 animate-pulse uppercase tracking-widest text-sm">Cargando...</p>
      </div>
  );

  if (!local) return (
      <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Local no encontrado</div>
  );

  // -----------------------------------------------------------
  // 🔥 LÓGICA DE SEGURIDAD (BLOQUEO DE CUENTA)
  // -----------------------------------------------------------
  if (local.estado !== 'activo') {
      // Si está bloqueado, también le cambiamos el título para que no se vea feo
      document.title = "Local no disponible";
      
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center font-sans">
          
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl text-4xl animate-pulse">
            ⏳
          </div>
  
          <h1 className="text-3xl font-black text-gray-800 mb-4 tracking-tight">
            Local en Pausa
          </h1>
  
          <p className="text-gray-500 max-w-md font-medium text-lg leading-relaxed">
            Este perfil se encuentra temporalmente desactivado mientras realizamos ajustes en la agenda.
          </p>
  
          <p className="text-sm text-gray-400 mt-2">
            Por favor, vuelve a intentarlo más tarde.
          </p>
  
          <Link 
            href="/" 
            className="mt-10 px-8 py-4 bg-black text-white rounded-2xl font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-lg text-xs"
          >
            Buscar otros locales
          </Link>
  
          <div className="mt-12 opacity-30">
             <img src="/logos/logo-agendalo.png" className="w-20 h-auto grayscale" alt="Logo" />
          </div>
        </div>
      )
  }

  // -----------------------------------------------------------
  // PERFIL NORMAL
  // -----------------------------------------------------------

  return (
    <main className="min-h-screen bg-white font-sans text-gray-900 pb-20 relative">
      
      {/* MENSAJE DE ÉXITO */}
      {reservaExitosa && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full text-center shadow-2xl transform transition-all scale-100 relative overflow-hidden">
            
            <div className="w-48 h-48 mx-auto mb-6 flex items-center justify-center">
               <img 
                 src="/logos/logo-agendalo.png" 
                 alt="Logo Agendalo" 
                 className="w-full h-full object-contain drop-shadow-md" 
               />
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 mb-2">¡Listo {nombre}!</h2>
            
            <p className="text-gray-500 font-medium mb-8">
              Tu hora para <span className="font-bold text-blue-600">{servicioSeleccionado?.nombre}</span> 
              {" "}en <span className="font-bold text-gray-800">{local?.nombre}</span> 
              {" "}ha sido agendada correctamente. <br/>
              Revisa tu correo para más detalles.
            </p>
            
            <button 
              onClick={cerrarTodo}
              className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg uppercase tracking-widest text-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Banner */}
      <div className="h-64 bg-blue-900 relative flex items-center justify-center text-white text-center">
        <img src={local.foto_banner || 'https://via.placeholder.com/1200x600'} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="" />
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
                  WhatsApp {local.telefono_local}
                </a>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-black mb-6 uppercase tracking-tight">Servicios</h2>
        <div className="grid gap-4">
          {servicios.map(s => (
            <div key={s.id} className="border-2 border-gray-50 p-4 md:p-6 rounded-[2rem] flex items-center justify-between bg-white shadow-sm hover:border-blue-500 transition-all group">
              
              <div className="flex items-center gap-4">
                {s.imagen_url && (
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0 shadow-sm border border-gray-100">
                    <img 
                      src={s.imagen_url} 
                      alt={s.nombre} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                )}
                
                <div>
                  <h3 className="font-bold text-lg md:text-xl group-hover:text-blue-600 transition-colors leading-tight">
                    {s.nombre}
                  </h3>
                  <p className="text-blue-600 font-black text-xl md:text-2xl">
                    ${s.precio.toLocaleString('es-CL')}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => { setServicioSeleccionado(s); setMostrarForm(true); }} 
                className="bg-black text-white px-5 py-3 md:px-8 md:py-3 rounded-2xl font-bold hover:bg-blue-600 transition shadow-md text-sm md:text-base shrink-0 ml-2"
              >
                Agendar
              </button>
            </div>
          ))}
        </div>
      </div>

      <footer className="mt-16 py-10 text-center border-t border-gray-100 bg-gray-50/50">
        <a 
          href="/" 
          target="_blank" 
          className="group inline-flex flex-col items-center gap-3 transition-all hover:scale-105"
        >
          <div className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">
                Potenciado por
              </p>
              <p className="text-gray-900 font-black text-sm leading-tight group-hover:text-blue-600">
                Agéndalo Talca
              </p>
            </div>
            
            <img 
              src="/logos/logo-agendalo.png" 
              alt="Logo" 
              className="w-16 h-16 object-contain" 
            />
          </div>

          <p className="text-[11px] text-gray-500 font-medium bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
            🚀 ¿Tienes un local? <span className="underline decoration-blue-200 underline-offset-2">Crea tu agenda aquí</span>
          </p>
        </a>
        
        <p className="text-[10px] text-gray-300 mt-6">
          © {new Date().getFullYear()} Derechos Reservados.
        </p>
      </footer>

      {/* MODAL AGENDAMIENTO */}
      {mostrarForm && servicioSeleccionado && !reservaExitosa && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 md:p-4 z-50">
          <div className="bg-white md:rounded-[3rem] shadow-2xl overflow-hidden max-w-5xl w-full h-full md:h-auto md:max-h-[90vh] flex flex-col md:flex-row">
            
            <div className={`p-6 md:p-8 border-r bg-gray-50/50 md:w-1/2 overflow-y-auto ${horaSeleccionada ? 'hidden md:block' : 'block'}`}>
              
              <button onClick={() => setMostrarForm(false)} className="md:hidden mb-4 text-gray-400 font-bold text-sm">
                ✕ CERRAR
              </button>

              <div className="mb-6">
                <p className="text-blue-600 font-black uppercase text-[10px] tracking-widest mb-1">Paso 1: Elige Fecha</p>
                <h3 className="text-xl font-bold leading-tight tracking-tight text-gray-800">
                  Reserva para: <br/>
                  <span className="text-blue-600">
                    {servicioSeleccionado.nombre} — ${servicioSeleccionado.precio.toLocaleString('es-CL')}
                  </span>
                </h3>
              </div>
              
              <div className="bg-white p-4 md:p-6 rounded-3xl border mb-6 shadow-sm">
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

            <div className={`p-6 md:p-8 md:w-1/2 flex-col justify-center bg-white overflow-y-auto ${!horaSeleccionada ? 'hidden md:flex' : 'flex'}`}>
              
              <button 
                onClick={() => setHoraSeleccionada('')} 
                className="md:hidden mb-6 flex items-center gap-2 text-gray-500 font-bold text-xs uppercase tracking-widest"
              >
                ← Volver al calendario
              </button>

              {!horaSeleccionada ? (
                <div className="hidden md:block text-center py-20 text-gray-400 font-bold italic text-xs uppercase tracking-widest opacity-50 select-none">
                  Selecciona una fecha y hora <br/> para continuar...
                </div>
              ) : (
                <form onSubmit={enviar} className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                  
                  <div className="bg-green-50 p-5 rounded-2xl border border-green-100 mb-2 shadow-sm flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Tu cita</p>
                      <p className="font-bold text-green-900 leading-tight text-sm md:text-base">
                        {format(diaSeleccionado as Date, "eeee dd 'de' MMMM", {locale: es})} <br/>
                        a las {horaSeleccionada} hrs
                      </p>
                    </div>
                    <div className="pl-4">
                      <img 
                        src="/logos/logo-agendalo.png" 
                        alt="Logo" 
                        className="w-16 h-16 object-contain opacity-80" 
                      />
                    </div>
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