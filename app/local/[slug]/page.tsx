'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '../../../lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isBefore, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

export default function PaginaLocal(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const [local, setLocal] = useState<any>(null);
  const [servicios, setServicios] = useState<any[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<any>(null);
  
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
    const cargar = async () => {
      const { data: L } = await supabase.from('locales').select('*').eq('slug', params.slug).single();
      const { data: S } = await supabase.from('servicios').select('*').eq('local_slug', params.slug);
      setLocal(L); setServicios(S || []);
    };
    cargar();
  }, [params.slug]);

  useEffect(() => {
    if (diaSeleccionado) {
      const consultar = async () => {
        const { data } = await supabase.from('agendamientos').select('hora').eq('fecha', format(diaSeleccionado!, 'yyyy-MM-dd')).eq('local', params.slug);
        setBloquesOcupados(data?.map(d => d.hora) || []);
      };
      consultar();
    }
  }, [diaSeleccionado, params.slug]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('agendamientos').insert([{
      cliente_nombre: nombre, cliente_email: email, cliente_telefono: telefono,
      servicio_id: servicioSeleccionado.id, local: params.slug,
      fecha: format(diaSeleccionado!, 'yyyy-MM-dd'), hora: horaSeleccionada
    }]);
    if (!error) { alert('¡Agendado con éxito!'); setMostrarForm(false); }
  };

  const dias = eachDayOfInterval({ start: startOfMonth(mesActual), end: endOfMonth(mesActual) });

  return (
    <main className="min-h-screen bg-white font-sans text-gray-900">
      {/* Banner */}
      <div className="h-64 bg-blue-900 relative flex items-center justify-center text-white">
        <img src={local?.foto_banner} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="" />
        <h1 className="relative text-4xl md:text-6xl font-black uppercase tracking-tighter">{local?.nombre}</h1>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* INFO DEL LOCAL: Dirección y Botón Maps aquí */}
        <div className="text-center mb-12 -mt-10 relative z-10">
          <div className="bg-white shadow-xl rounded-3xl p-6 border border-gray-100 inline-block max-w-full">
            <p className="text-gray-500 italic mb-4">"{local?.descripcion}"</p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border">
                <span className="text-sm font-bold text-gray-700">📍 {local?.direccion}</span>
                {local?.google_maps_url && (
                  <a href={local.google_maps_url} target="_blank" className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded-lg font-black uppercase">Ver Mapa</a>
                )}
              </div>
              <a href={`tel:${local?.telefono}`} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold text-sm">📞 {local?.telefono}</a>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-black mb-6 uppercase tracking-tight">Servicios Disponibles</h2>
        <div className="grid gap-4">
          {servicios.map(s => (
            <div key={s.id} className="border-2 border-gray-50 p-6 rounded-[2rem] flex justify-between items-center hover:border-blue-500 transition-all bg-white shadow-sm">
              <div>
                <h3 className="font-bold text-xl">{s.nombre}</h3>
                <p className="text-blue-600 font-black text-2xl">${s.precio.toLocaleString('es-CL')}</p>
              </div>
              <button onClick={() => { setServicioSeleccionado(s); setMostrarForm(true); }} className="bg-black text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-600 transition">Agendar</button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL REDISEÑADO: DOS COLUMNAS */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row max-h-[90vh]">
            
            {/* IZQUIERDA: CALENDARIO */}
            <div className="p-8 border-r bg-gray-50/50 md:w-1/2 overflow-y-auto">
              <div className="mb-6">
                <p className="text-blue-600 font-black uppercase text-xs mb-1">Paso 1</p>
                <h3 className="text-xl font-bold">Usted está agendando: <span className="text-blue-600">{servicioSeleccionado.nombre}</span></h3>
              </div>
              
              <div className="bg-white p-6 rounded-3xl border mb-6">
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => setMesActual(subMonths(mesActual, 1))} className="font-bold">◀</button>
                  <span className="font-bold capitalize">{format(mesActual, 'MMMM yyyy', { locale: es })}</span>
                  <button onClick={() => setMesActual(addMonths(mesActual, 1))} className="font-bold">▶</button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {['D','L','M','M','J','V','S'].map(d => <div key={d} className="text-center text-[10px] font-bold text-gray-300">{d}</div>)}
                  {dias.map(dia => {
                    const esPasado = isBefore(dia, startOfDay(new Date()));
                    const sel = diaSeleccionado && isSameDay(dia, diaSeleccionado);
                    return (
                      <button key={dia.toString()} disabled={esPasado} onClick={() => {setDiaSeleccionado(dia); setHoraSeleccionada('');}}
                        className={`h-9 w-9 rounded-xl text-xs font-bold transition ${esPasado ? 'text-gray-200' : sel ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-gray-700'}`}>
                        {format(dia, 'd')}
                      </button>
                    )
                  })}
                </div>
              </div>

              {diaSeleccionado && (
                <div className="grid grid-cols-4 gap-2">
                  {horarios.map(h => (
                    <button key={h} disabled={bloquesOcupados.includes(h)} onClick={() => setHoraSeleccionada(h)}
                      className={`p-2 rounded-xl text-[10px] font-black border ${bloquesOcupados.includes(h) ? 'bg-gray-50 text-gray-200 cursor-not-allowed' : horaSeleccionada === h ? 'bg-black text-white' : 'bg-white border-gray-100 hover:border-blue-500'}`}>
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DERECHA: FORMULARIO */}
            <div className="p-8 md:w-1/2 flex flex-col justify-center bg-white overflow-y-auto">
              {!horaSeleccionada ? (
                <div className="text-center py-20">
                  <div className="text-4xl mb-4">📅</div>
                  <p className="text-gray-400 font-bold italic">Seleccione fecha y hora para continuar...</p>
                </div>
              ) : (
                <form onSubmit={enviar} className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-2xl mb-4 border border-green-100">
                    <p className="text-[10px] font-black text-green-600 uppercase">Fecha Seleccionada</p>
                    <p className="font-bold text-green-900">{format(diaSeleccionado!, "eeee dd 'de' MMMM", {locale: es})} a las {horaSeleccionada} hrs</p>
                  </div>
                  
                  <input required placeholder="Nombre Completo" className="w-full border p-4 rounded-2xl outline-none bg-gray-50" value={nombre} onChange={e => setNombre(e.target.value)} />
                  <input required type="email" placeholder="Correo Electrónico" className="w-full border p-4 rounded-2xl outline-none bg-gray-50" value={email} onChange={e => setEmail(e.target.value)} />
                  <input required type="tel" placeholder="WhatsApp" className="w-full border p-4 rounded-2xl outline-none bg-gray-50" value={telefono} onChange={e => setTelefono(e.target.value)} />

                  <div onClick={() => setMetodoPago(metodoPago === 'presencial' ? 'online' : 'presencial')} className={`p-4 border-2 rounded-2xl cursor-pointer transition ${metodoPago === 'online' ? 'border-green-500 bg-green-50' : 'border-gray-100'}`}>
                    <div className="flex justify-between items-center text-xs font-bold uppercase">
                      <span>Pago Online (-10%)</span>
                      <span className="text-green-600 font-black">-${Math.round(servicioSeleccionado.precio * 0.1).toLocaleString('es-CL')}</span>
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition">CONFIRMAR AGENDA</button>
                  <button type="button" onClick={() => setMostrarForm(false)} className="w-full text-gray-400 text-xs font-bold pt-2 uppercase">Volver</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}