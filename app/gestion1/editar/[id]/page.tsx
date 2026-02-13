'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

const RUBROS_PREDEFINIDOS = [
  "Belleza", "Peluquería", "Manicura", "Barbería", "Salud", 
  "Comida", "Entretención", "Celebración", "Deporte", "Bienestar", 
  "Mascotas", "Educación", "Automotriz", "Hogar"
];

export default function EditarCliente() {
  const router = useRouter()
  const params = useParams()
  
  const [enviando, setEnviando] = useState(false)
  const [subiendoImagen, setSubiendoImagen] = useState(false) // Nuevo estado
  const [exito, setExito] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [planes, setPlanes] = useState<any[]>([])
  
  // Guardamos el email original para poder actualizar la relación si cambia
  const [emailOriginal, setEmailOriginal] = useState('')

  const [rubrosSeleccionados, setRubrosSeleccionados] = useState<string[]>([])
  const [mostrarOtroRubro, setMostrarOtroRubro] = useState(false)
  const [otroRubro, setOtroRubro] = useState('')

  const [form, setForm] = useState({
    nombre_dueño: '', correo_dueño: '', telefono_dueño: '',
    plan: '', cantidad_locales: 1,
    nombre_local: '', slug: '', email_local: '', telefono_local: '',
    direccion: '', 
    visible: true, 
    maps_url: '', foto_banner: '', descripcion: ''
  })

  // CARGAR DATOS AL INICIAR
  useEffect(() => {
    async function fetchData() {
        if (!params.id) return;

        // 1. Cargar Planes
        const { data: planesData } = await supabase.from('planes').select('*')
        if (planesData) setPlanes(planesData)

        // 2. Cargar Dueño
        const { data: dueño, error: errorDueño } = await supabase
            .from('dueño_local')
            .select('*')
            .eq('id', params.id)
            .single()
        
        if (errorDueño || !dueño) {
            alert("Error al cargar el dueño o no existe.")
            router.push('/gestion1')
            return
        }

        setEmailOriginal(dueño.correo_dueño);

        // 3. Cargar Local (Usando el email original)
        const { data: local } = await supabase
            .from('locales')
            .select('*')
            .eq('correo_dueño', dueño.correo_dueño)
            .single()

        // 4. Rellenar Formulario
        setForm({
            nombre_dueño: dueño.nombre_dueño || '',
            correo_dueño: dueño.correo_dueño || '',
            telefono_dueño: dueño.telefono_dueño ? dueño.telefono_dueño.replace('+569', '') : '',
            plan: dueño.plan || '',
            cantidad_locales: dueño.cantidad_locales || 1,
            // Datos del Local
            nombre_local: local?.nombre || dueño.nombre_local || '',
            slug: local?.slug || '',
            email_local: local?.email_local || '',
            telefono_local: local?.telefono_local ? local.telefono_local.replace('+569', '') : '',
            direccion: local?.direccion || '',
            visible: dueño.estado !== 'standby',
            maps_url: local?.maps_url || '',
            foto_banner: local?.foto_banner || '',
            descripcion: local?.descripcion || ''
        })

        // 5. Rellenar Rubros
        if (local?.rubro) {
            const rubrosBD = local.rubro.split(', ');
            const esOtro = rubrosBD.some((r: string) => !RUBROS_PREDEFINIDOS.includes(r));
            
            if (esOtro) {
                setMostrarOtroRubro(true);
                setOtroRubro(rubrosBD[0]); 
                setRubrosSeleccionados([]);
            } else {
                setRubrosSeleccionados(rubrosBD);
            }
        }
        
        setCargando(false)
    }
    fetchData()
  }, [params.id])

  const planSeleccionado = planes.find(p => p.nombre === form.plan)

  // --- LOGICA REUTILIZADA ---
  const toggleRubro = (rubro: string) => {
    if (mostrarOtroRubro) {
        setMostrarOtroRubro(false)
        setOtroRubro('')
        setRubrosSeleccionados([rubro])
        return
    }
    if (rubrosSeleccionados.includes(rubro)) {
      setRubrosSeleccionados(prev => prev.filter(r => r !== rubro))
    } else {
      setRubrosSeleccionados(prev => [...prev, rubro])
    }
  }

  const activarOtroRubro = () => {
      setRubrosSeleccionados([])
      setMostrarOtroRubro(!mostrarOtroRubro)
  }

  // --- LÓGICA DE SUBIDA DE IMAGEN (NUEVA) ---
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setSubiendoImagen(true);

      if (!event.target.files || event.target.files.length === 0) {
        return; // No se seleccionó nada
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Subir la imagen al bucket 'locales'
      const { error: uploadError } = await supabase.storage
        .from('locales')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Obtener la URL pública
      const { data } = supabase.storage
        .from('locales')
        .getPublicUrl(filePath);

      // 3. Guardar la URL en el estado del formulario
      setForm(prev => ({ ...prev, foto_banner: data.publicUrl }));

    } catch (error: any) {
      alert('Error subiendo imagen: ' + error.message);
    } finally {
      setSubiendoImagen(false);
    }
  };


  const cleanPhone = (val: string) => val.replace(/\D/g, '').slice(0, 8);
  const generarSlug = (nombre: string) => nombre.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)

    let rubroString = '';
    if (mostrarOtroRubro && otroRubro.trim() !== '') {
       rubroString = otroRubro.trim();
    } else {
       rubroString = rubrosSeleccionados.join(', ');
    }

    const estadoFinal = form.visible ? 'activo' : 'standby';

    try {
      // 1. ACTUALIZAR DUEÑO
      const { error: errDueño } = await supabase.from('dueño_local').update({
          nombre_dueño: form.nombre_dueño,
          correo_dueño: form.correo_dueño,
          telefono_dueño: form.telefono_dueño ? `+569${form.telefono_dueño}` : '',
          nombre_local: form.nombre_local,
          plan: form.plan,
          estado: estadoFinal,
          cantidad_locales: form.cantidad_locales
      }).eq('id', params.id)

      if (errDueño) throw errDueño

      // 2. ACTUALIZAR LOCAL
      const { error: errLocal } = await supabase.from('locales').update({
        nombre: form.nombre_local,
        slug: form.slug || generarSlug(form.nombre_local),
        correo_dueño: form.correo_dueño,
        email_local: form.email_local,
        telefono_local: form.telefono_local ? `+569${form.telefono_local}` : '',
        direccion: form.direccion,
        rubro: rubroString,
        estado: estadoFinal,
        maps_url: form.maps_url,
        foto_banner: form.foto_banner,
        descripcion: form.descripcion
      }).eq('correo_dueño', emailOriginal)

      if (errLocal) throw errLocal

      setExito(true)

    } catch (error: any) {
      alert("Error al actualizar: " + error.message)
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="font-black text-gray-300 animate-pulse text-xl">CARGANDO DATOS...</p>
      </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans text-gray-900 relative">
      
      {/* MODAL DE ÉXITO */}
      {exito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[3rem] p-10 max-w-md w-full text-center shadow-2xl animate-bounce-in">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">💾</span>
                </div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2">¡Actualizado!</h2>
                <p className="text-gray-500 font-medium mb-8">Los datos han sido modificados correctamente.</p>
                <button onClick={() => router.push('/gestion1')} className="w-full bg-black text-white font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-gray-800 transition-all">Volver al Panel</button>
            </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Editar Cliente</h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Modificar información</p>
          </div>
          <button onClick={() => router.back()} className="text-gray-400 font-bold uppercase text-xs hover:text-black transition-colors">← Cancelar</button>
        </div>

        <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* SECCIÓN 1: DUEÑO */}
          <div className="bg-blue-50/50 p-8 rounded-[3rem] border border-blue-100 space-y-6">
            <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest italic border-b border-blue-200 pb-3">1. Datos del Dueño</h2>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Nombre Completo</label>
              <input required className="w-full bg-white p-4 rounded-2xl font-bold text-sm outline-none border border-transparent focus:border-blue-300 transition-all" 
                value={form.nombre_dueño} onChange={e => setForm({...form, nombre_dueño: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Correo (Login)</label>
              <input required type="email" className="w-full bg-white p-4 rounded-2xl font-bold text-sm outline-none border border-transparent focus:border-blue-300 transition-all" 
                value={form.correo_dueño} onChange={e => setForm({...form, correo_dueño: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Teléfono Móvil</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs border-r pr-3">+56 9</span>
                <input required className="w-full bg-white pl-24 pr-5 py-4 rounded-2xl font-bold text-sm outline-none border border-transparent focus:border-blue-300 transition-all" 
                  value={form.telefono_dueño} onChange={e => setForm({...form, telefono_dueño: cleanPhone(e.target.value)})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
               <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Plan</label>
                  <select className="w-full bg-white p-4 rounded-2xl font-bold text-sm outline-none" value={form.plan} onChange={e => setForm({...form, plan: e.target.value})}>
                    <option value="">Seleccionar</option>
                    {planes.map(p => (
                        <option key={p.id} value={p.nombre}>{p.nombre}</option>
                    ))}
                  </select>
               </div>
               <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Locales</label>
                  <input type="number" className="w-full bg-white p-4 rounded-2xl font-bold text-sm outline-none" 
                    value={form.cantidad_locales} onChange={e => setForm({...form, cantidad_locales: parseInt(e.target.value)})} />
               </div>
            </div>
            
             {/* VISTA PREVIA DEL PLAN CON PRECIO */}
             {planSeleccionado && (
                <div className="bg-white p-6 rounded-[2rem] border border-blue-100 animate-fade-in mt-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Detalle Plan</span>
                        <span className="text-blue-600 font-black text-xl">${(planSeleccionado.valor || 0).toLocaleString('es-CL')}</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed italic">{planSeleccionado.descripcion || "Sin descripción."}</p>
                </div>
            )}
          </div>

          {/* SECCIÓN 2: NEGOCIO */}
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl space-y-6">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest italic border-b border-gray-100 pb-3">2. Datos del Negocio</h2>

            {/* FILA 1: NOMBRE + EMAIL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Nombre Local</label>
                  <input required className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-2 ring-black transition-all" 
                    value={form.nombre_local} 
                    onChange={e => setForm({...form, nombre_local: e.target.value, slug: generarSlug(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Email Local</label>
                  <input type="email" className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm outline-none" 
                    value={form.email_local} onChange={e => setForm({...form, email_local: e.target.value})} />
                </div>
            </div>

            {/* FILA 2: RUTA (2/3) + TEL (1/3) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Ruta Personalizada</label>
                    <div className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm text-blue-600 flex items-center gap-1 border border-transparent focus-within:border-blue-200 transition-all overflow-hidden">
                      <span className="text-[10px] text-gray-400 pointer-events-none select-none whitespace-nowrap">agendalotalca.cl/</span>
                      <input required className="bg-transparent outline-none flex-1 placeholder-blue-200 w-full min-w-0" 
                        value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} />
                    </div>
                </div>
                <div className="md:col-span-1 space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Tel. Local</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-black text-[10px] border-r border-gray-300 pr-1">+56 9</span>
                    <input className="w-full bg-gray-50 pl-16 pr-3 py-4 rounded-2xl font-bold text-sm outline-none" 
                      value={form.telefono_local} onChange={e => setForm({...form, telefono_local: cleanPhone(e.target.value)})} />
                  </div>
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Rubro</label>
               <div className="flex flex-wrap gap-2">
                 {RUBROS_PREDEFINIDOS.map(rubro => (
                   <button key={rubro} type="button" onClick={() => toggleRubro(rubro)}
                     className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all uppercase ${
                       rubrosSeleccionados.includes(rubro) ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                     }`}>
                     {rubro}
                   </button>
                 ))}
                 <button type="button" onClick={activarOtroRubro}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all uppercase ${mostrarOtroRubro ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-400 border-blue-100'}`}>
                    + Otro
                 </button>
               </div>
               {mostrarOtroRubro && (
                 <input placeholder="Escribe el rubro nuevo..." value={otroRubro} onChange={e => setOtroRubro(e.target.value)}
                   className="w-full mt-2 bg-blue-50 p-3 rounded-xl border border-blue-100 font-bold text-sm outline-none text-blue-800" />
               )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Dirección</label>
              <input className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm outline-none" 
                value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} />
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-4">
               
               {/* MODIFICADO: MAPS + FOTO UPLOAD */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Google Maps URL</label>
                       <input className="w-full bg-gray-50 p-3 rounded-xl font-medium text-xs outline-none" 
                              placeholder="Maps URL" 
                              value={form.maps_url} 
                              onChange={e => setForm({...form, maps_url: e.target.value})} />
                   </div>
                   
                   {/* NUEVO INPUT DE IMAGEN EN EDITAR */}
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-2">
                          Foto Portada 
                          
                          {subiendoImagen && <span className="text-blue-500 animate-pulse">- Subiendo...</span>}
                      <span className="block text-[9px] text-gray-500 font-medium normal-case mt-0.5">
    (Ideal: 1200x675px o formato horizontal)
  </span>
                      
                      </label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={subiendoImagen}
                        className="w-full bg-gray-50 p-2 rounded-xl font-medium text-xs outline-none file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-gray-500" 
                      />
                   </div>
               </div>

               {/* VISTA PREVIA (MUESTRA LA FOTO ACTUAL SI YA EXISTE) */}
               {form.foto_banner && (
                 <div className="w-full h-40 rounded-xl overflow-hidden relative group border border-gray-200">
                    <img src={form.foto_banner} alt="Vista Previa" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-md">
                        {subiendoImagen ? 'Actualizando...' : 'Imagen Actual'}
                    </div>
                 </div>
               )}

               <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Descripción</label>
                  <textarea className="w-full bg-gray-50 p-3 rounded-xl font-medium text-xs outline-none h-20 resize-none" placeholder="Descripción..." value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
               </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-gray-100">
                <div className="space-y-1">
                    <p className="font-black text-sm uppercase">Visible en el portal</p>
                    <p className="text-[10px] text-gray-400 font-medium">Si desactivas, pasa a Oculto.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={form.visible} onChange={e => setForm({...form, visible: e.target.checked})} />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                </label>
            </div>
          </div>

          <div className="lg:col-span-2 pb-10">
            <button disabled={enviando || subiendoImagen} type="submit" className="w-full bg-black text-white font-black py-6 rounded-[2rem] shadow-2xl hover:bg-gray-800 transition-all uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {enviando ? 'Guardando...' : subiendoImagen ? 'Esperando imagen...' : 'Guardar Cambios'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}