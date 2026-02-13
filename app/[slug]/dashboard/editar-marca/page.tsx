'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditarMarca() {
  const { slug } = useParams()
  const router = useRouter()
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  
  // Estado para el Modal de Plan
  const [mostrarModalPlan, setMostrarModalPlan] = useState(false)

  // Estado para Mensajes de Éxito/Error
  const [mensajeEstado, setMensajeEstado] = useState({
     mostrar: false,
     tipo: '', 
     titulo: '',
     mensaje: ''
  })

  // Variables auxiliares
  const [idDueno, setIdDueno] = useState<number | null>(null)
  const [originalEmail, setOriginalEmail] = useState('')

  // ESTADOS DEL FORMULARIO
  const [formData, setFormData] = useState({
    nombre: '', 
    email_administrativo: '', 
    telefono_central: '',     
    descripcion: '',          
    plan_id: null, 
    plan_nombre: 'Plan Básico', 
    plan_valor: '$0' 
  })

  // ESTADOS PARA RUBROS
  const [listaRubrosDb, setListaRubrosDb] = useState<any[]>([]) 
  const [rubrosSeleccionados, setRubrosSeleccionados] = useState<string[]>([]) 
  const [modoOtro, setModoOtro] = useState(false) 
  const [nuevoRubroTexto, setNuevoRubroTexto] = useState('') 

  useEffect(() => {
    const fetchDatos = async () => {
      const sesionStr = localStorage.getItem('sesion_dueño')
      if (!sesionStr) {
        router.push(`/${slug}/admin`)
        return
      }

      try {
        // 1. Cargar RUBROS
        const { data: rubrosDb } = await supabase
          .from('rubros')
          .select('*')
          .order('nombre', { ascending: true })
        if (rubrosDb) setListaRubrosDb(rubrosDb)

        // 2. Cargar LOCAL
        const { data: localData, error: localError } = await supabase
          .from('locales')
          .select('*')
          .eq('slug', slug)
          .single()

        if (localError) throw localError

        document.title = `${localData.nombre?.toUpperCase() || 'LOCAL'} | EDITAR LOCAL`

        // 3. RECUPERAR DATOS DEL DUEÑO
        let rawPhone = ''
        let realEmail = ''
        
        if (localData.codigo_dueño) {
            setIdDueno(localData.codigo_dueño) 

            const { data: duenoData }: any = await supabase
              .from('dueño_local')
              .select('id, telefono_dueño, correo_dueño')
              .eq('id', localData.codigo_dueño)
              .single()
            
            if (duenoData) {
                realEmail = duenoData.correo_dueño || ''
                if (duenoData.telefono_dueño) {
                    rawPhone = duenoData.telefono_dueño.toString().replace(/^\+?569/, '')
                }
            }
        } 

        setOriginalEmail(realEmail)

        // 4. PLAN
        let nombrePlan = 'Plan Básico'
        let valorPlan = '$0'
        if (localData.cod_plan) { 
            const { data: planData } = await supabase
            .from('planes')
            .select('nombre, valor')
            .eq('id', localData.cod_plan)
            .single()
            if (planData) { 
                nombrePlan = planData.nombre; 
                valorPlan = planData.valor; 
            }
        }

        // 5. Rubros
        const rubroString = localData.rubro || '';
        const seleccionadosArray = rubroString 
            ? rubroString.split(',').map((r: string) => r.trim()) 
            : []
        
        const esRubroConocido = rubrosDb?.some((r: any) => r.nombre === rubroString) 
                                || seleccionadosArray.every((s: string) => rubrosDb?.some((db: any) => db.nombre === s));

        if (!esRubroConocido && rubroString.length > 0 && seleccionadosArray.length === 1) {
             setModoOtro(true)
             setNuevoRubroTexto(rubroString)
             setRubrosSeleccionados([])
        } else {
             setRubrosSeleccionados(seleccionadosArray)
        }

        setFormData({
            nombre: localData.nombre || '',
            email_administrativo: realEmail, 
            telefono_central: rawPhone,      
            descripcion: localData.descripcion || '',
            plan_id: localData.cod_plan,
            plan_nombre: nombrePlan,
            plan_valor: valorPlan
        })

      } catch (error) {
        console.error("Error cargando datos:", error)
      } finally {
        setCargando(false)
      }
    }

    fetchDatos()
  }, [slug, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Si es el teléfono, solo permitimos números
    if (e.target.name === 'telefono_central') {
        const soloNumeros = e.target.value.replace(/[^0-9]/g, '')
        setFormData({ ...formData, [e.target.name]: soloNumeros })
    } else {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }
  }

  // --- LÓGICA DE RUBROS ---
  const toggleRubro = (nombreRubro: string) => {
    if (modoOtro) {
        setModoOtro(false)
        setNuevoRubroTexto('')
        setRubrosSeleccionados([nombreRubro])
    } else {
        if (rubrosSeleccionados.includes(nombreRubro)) {
            setRubrosSeleccionados(rubrosSeleccionados.filter(r => r !== nombreRubro))
        } else {
            setRubrosSeleccionados([...rubrosSeleccionados, nombreRubro])
        }
    }
  }

  const activarOtro = () => {
    setModoOtro(true)
    setRubrosSeleccionados([])
    setNuevoRubroTexto('')
  }

  const cerrarModalEstado = () => {
     setMensajeEstado({ ...mensajeEstado, mostrar: false })
     if (mensajeEstado.tipo === 'exito') {
        router.push(`/${slug}/dashboard`)
     }
  }

  // --- GUARDADO CON VALIDACIONES ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)

    // --- 1. VALIDACIONES ESTRICTAS ---
    
    // Validar ID Dueño
    if (!idDueno) {
        setMensajeEstado({ mostrar: true, tipo: 'error', titulo: 'Error Crítico', mensaje: 'No se identificó al dueño. Recarga la página.' })
        setGuardando(false)
        return
    }

    // Validar Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email_administrativo || !emailRegex.test(formData.email_administrativo)) {
        setMensajeEstado({ mostrar: true, tipo: 'error', titulo: 'Email Inválido', mensaje: 'Por favor ingresa un correo electrónico válido.' })
        setGuardando(false)
        return
    }

    // Validar Teléfono (Exactamente 8 dígitos)
    if (!formData.telefono_central || formData.telefono_central.length !== 8) {
        setMensajeEstado({ mostrar: true, tipo: 'error', titulo: 'Teléfono Inválido', mensaje: 'El teléfono debe tener exactamente 8 dígitos (ej: 12345678).' })
        setGuardando(false)
        return
    }

    // Validar Rubros
    if (!modoOtro && rubrosSeleccionados.length === 0) {
        setMensajeEstado({ mostrar: true, tipo: 'error', titulo: 'Falta Rubro', mensaje: 'Debes seleccionar al menos una categoría para tu negocio.' })
        setGuardando(false)
        return
    }
    if (modoOtro && nuevoRubroTexto.trim() === '') {
        setMensajeEstado({ mostrar: true, tipo: 'error', titulo: 'Falta Rubro', mensaje: 'Si seleccionas "Otro", debes escribir el nombre del rubro.' })
        setGuardando(false)
        return
    }

    try {
        // --- 2. PROCESO DE GUARDADO ---

        // Preparar Rubros
        let rubroFinalString = ''
        if (modoOtro) {
            const nuevoNombre = nuevoRubroTexto.trim()
            rubroFinalString = nuevoNombre
            const existe = listaRubrosDb.find((r: any) => r.nombre.toLowerCase() === nuevoNombre.toLowerCase())
            if (!existe) {
                await supabase.from('rubros').insert([{ 
                    nombre: nuevoNombre,
                    insert_by: formData.email_administrativo 
                }])
            }
        } else {
            rubroFinalString = rubrosSeleccionados.join(', ')
        }

        const telefonoGuardar = `569${formData.telefono_central}`
        const nuevoEmail = formData.email_administrativo.trim()

        // Actualizar DUEÑO
        const { error: errorDueno } = await supabase
            .from('dueño_local')
            .update({
                correo_dueño: nuevoEmail,
                telefono_dueño: telefonoGuardar
            })
            .eq('id', idDueno)

        if (errorDueno) throw errorDueno

        // Actualizar LOCAL
        const { error: errorLocales } = await supabase
            .from('locales')
            .update({
                rubro: rubroFinalString,
                descripcion: formData.descripcion
            })
            .eq('slug', slug)

        if (errorLocales) throw errorLocales

        // Actualizar SESIÓN
        if (originalEmail !== nuevoEmail) {
            const sesionActual = localStorage.getItem('sesion_dueño')
            if (sesionActual) {
                const sesionObj = JSON.parse(sesionActual)
                sesionObj.email = nuevoEmail
                localStorage.setItem('sesion_dueño', JSON.stringify(sesionObj))
            }
            setOriginalEmail(nuevoEmail)
        }

        setMensajeEstado({
            mostrar: true,
            tipo: 'exito',
            titulo: '¡Guardado!',
            mensaje: 'Datos actualizados correctamente.'
        })

    } catch (error: any) {
        console.error("Error al guardar:", error)
        setMensajeEstado({
            mostrar: true,
            tipo: 'error',
            titulo: 'Algo salió mal',
            mensaje: error.message || "Error desconocido."
        })
    } finally {
        setGuardando(false)
    }
  }

  if (cargando) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 font-bold uppercase text-xs tracking-widest animate-pulse">Cargando datos...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans text-gray-900 flex justify-center">
      <div className="w-full max-w-3xl bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 md:p-12 relative">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-10 border-b border-gray-100 pb-6">
           <div>
             <h1 className="text-3xl font-black uppercase italic tracking-tighter">Editar Local</h1>
             <p className="text-xs text-gray-400 font-bold uppercase mt-1">Gestionando: <span className="text-blue-600">{formData.nombre}</span></p>
           </div>
           <button onClick={() => router.back()} className="text-[10px] font-bold uppercase text-gray-400 hover:text-black bg-gray-50 px-4 py-2 rounded-xl transition-colors">Cancelar y Volver</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* CONTACTO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Email Administrativo (Dueño)</label>
              <input 
                 name="email_administrativo" 
                 type="email" // Validación nativa del navegador
                 value={formData.email_administrativo} 
                 onChange={handleChange}
                 className="bg-gray-50 border-none p-4 rounded-2xl text-sm font-bold text-gray-600 focus:ring-2 ring-blue-100 outline-none" 
                 required
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Teléfono Central (Dueño)</label>
              <div className="flex items-center bg-gray-50 rounded-2xl overflow-hidden focus-within:ring-2 ring-blue-100">
                 <span className="pl-4 text-xs font-black text-gray-400 select-none">+569</span>
                 <input 
                    name="telefono_central" 
                    value={formData.telefono_central} 
                    onChange={handleChange} 
                    type="tel" 
                    maxLength={8} 
                    className="bg-transparent border-none py-4 pr-4 pl-1 text-sm font-bold text-gray-900 outline-none w-full placeholder-gray-300" 
                    placeholder="12345678" 
                 />
              </div>
            </div>
          </div>

          {/* RUBROS */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-end">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Rubros del Local</label>
                {!modoOtro && <span className="text-[9px] text-blue-400 font-bold uppercase">{rubrosSeleccionados.length} seleccionados</span>}
            </div>
            <div className="flex flex-wrap gap-2">
                {listaRubrosDb.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleRubro(item.nombre)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                            (!modoOtro && rubrosSeleccionados.includes(item.nombre))
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                            : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300 hover:text-blue-500'
                        }`}
                    >
                        {item.nombre}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={activarOtro}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                        modoOtro
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                        : 'bg-white text-blue-400 border-blue-100 hover:border-blue-300 hover:text-blue-500'
                    }`}
                >
                    + Otro
                </button>
            </div>
            {modoOtro && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 mt-2 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <label className="text-[9px] font-black text-blue-400 uppercase ml-2 mb-1 block">Nuevo Rubro:</label>
                    <input 
                        value={nuevoRubroTexto}
                        onChange={(e) => setNuevoRubroTexto(e.target.value)}
                        placeholder="Ej: Agencia de Marketing"
                        className="w-full bg-white border border-blue-200 p-3 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 ring-blue-300 outline-none placeholder-gray-300"
                        autoFocus
                    />
                </div>
            )}
          </div>

          {/* DESCRIPCIÓN */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Descripción del Local</label>
            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows={4} className="bg-gray-50 border-none p-4 rounded-2xl text-sm font-bold text-gray-700 placeholder-gray-300 focus:ring-2 ring-blue-100 outline-none resize-none" />
          </div>

          {/* PLAN */}
          <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">💎</div>
                <div>
                    <span className="text-[9px] font-black text-purple-300 uppercase block tracking-widest">Plan del Dueño</span>
                    <h3 className="text-lg font-black text-purple-900 uppercase italic">{formData.plan_nombre}</h3>
                    <span className="text-xs font-bold text-purple-500">{formData.plan_valor} / mes</span>
                </div>
             </div>
             <button type="button" onClick={() => setMostrarModalPlan(true)} className="bg-white text-purple-600 font-black text-[10px] uppercase py-3 px-6 rounded-xl hover:bg-purple-100 transition-colors shadow-sm">Cambiar Plan</button>
          </div>

          <button type="submit" disabled={guardando} className="w-full bg-black text-white font-black uppercase text-xs py-5 rounded-2xl hover:bg-gray-800 transition-all shadow-xl disabled:opacity-50 mt-4">
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>

        </form>

        {/* MODAL PLAN */}
        {mostrarModalPlan && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300 border border-gray-100 text-center">
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">💎</div>
                <h3 className="text-2xl font-black uppercase italic mb-2 tracking-tighter">Mejorar Plan</h3>
                <p className="text-xs text-gray-500 font-bold mb-8 leading-relaxed">Para realizar un upgrade o cambio de plan, por favor comunícate directamente con nuestro equipo de ventas a través de WhatsApp.</p>
                <div className="flex flex-col gap-3">
                   <button onClick={() => window.open('https://wa.me/56900000000', '_blank')} className="w-full bg-green-500 text-white font-black uppercase text-xs py-4 rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-100">Contactar por WhatsApp</button>
                   <button onClick={() => setMostrarModalPlan(false)} className="w-full bg-gray-100 text-gray-500 font-black uppercase text-xs py-4 rounded-xl hover:bg-gray-200 transition-all">Volver</button>
                </div>
             </div>
          </div>
        )}

        {/* MODAL DE MENSAJES (ÉXITO / ERROR) */}
        {mensajeEstado.mostrar && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
             <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-gray-100 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm ${mensajeEstado.tipo === 'exito' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {mensajeEstado.tipo === 'exito' ? '✅' : '❌'}
                </div>
                <h3 className="text-2xl font-black uppercase italic mb-2 tracking-tighter text-gray-900">
                    {mensajeEstado.titulo}
                </h3>
                <p className="text-xs text-gray-500 font-bold mb-8 leading-relaxed">
                    {mensajeEstado.mensaje}
                </p>
                <button 
                    onClick={cerrarModalEstado} 
                    className={`w-full font-black uppercase text-xs py-4 rounded-xl transition-all shadow-lg text-white ${mensajeEstado.tipo === 'exito' ? 'bg-black hover:bg-gray-800' : 'bg-red-500 hover:bg-red-600 shadow-red-100'}`}
                >
                    {mensajeEstado.tipo === 'exito' ? 'Entendido, volver al Dashboard' : 'Cerrar y Corregir'}
                </button>
             </div>
          </div>
        )}

      </div>
    </div>
  )
}