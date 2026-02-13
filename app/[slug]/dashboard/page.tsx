'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DashboardDuenio() {
  const { slug } = useParams()
  const router = useRouter()
  
  const [tab, setTab] = useState('sucursales') 
  const [localData, setLocalData] = useState<any>(null)
  
  // Datos del dueño (teléfono y email)
  const [duenoInfo, setDuenoInfo] = useState({
      telefono: '',
      email: '',
      nombre: ''
  })
  
  const [sucursales, setSucursales] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const sesionStr = localStorage.getItem('sesion_dueño')
    if (!sesionStr) {
      router.push(`/${slug}/admin`)
      return
    }
    const sesion = JSON.parse(sesionStr)
    
    // Inicializamos el nombre del dueño con el de la sesión
    setDuenoInfo(prev => ({ ...prev, nombre: sesion.email.split('@')[0], email: sesion.email }))
    
    fetchDatos() 
  }, [slug])

  useEffect(() => {
    if (localData?.nombre) {
      const nuevoTitulo = `${localData.nombre.toUpperCase()} | PANEL`;
      document.title = nuevoTitulo;
      const timeoutId = setTimeout(() => { document.title = nuevoTitulo; }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [localData])

  async function fetchDatos() {
    try {
      setCargando(true)

      // 1. Cargar LOCAL (base)
      const { data: dataLocal, error: errorLocal } = await supabase
        .from('locales')
        .select('*') 
        .eq('slug', slug)
        .single()

      if (errorLocal) throw errorLocal
      
      // Procesar Plan (si existe cod_plan)
      let planNombre = 'Plan Emprendedor' // Default
      let planValor = '$15.000'          // Default
      
      if (dataLocal.cod_plan) {
         const { data: planDb } = await supabase
            .from('planes')
            .select('nombre, valor')
            .eq('id', dataLocal.cod_plan)
            .single()
         if (planDb) {
            planNombre = planDb.nombre
            planValor = planDb.valor
         }
      }

      // Guardamos localData enriquecido con info del plan
      setLocalData({ ...dataLocal, plan_nombre: planNombre, plan_valor: planValor })

      // 2. Cargar DUEÑO (Email y Teléfono) usando el ID (codigo_dueño)
      if (dataLocal.codigo_dueño) {
          const { data: dataDuenio }: any = await supabase
            .from('dueño_local')
            .select('telefono_dueño, correo_dueño')
            .eq('id', dataLocal.codigo_dueño)
            .single()
          
          if (dataDuenio) {
            setDuenoInfo(prev => ({ 
                ...prev, 
                telefono: dataDuenio.telefono_dueño || '',
                email: dataDuenio.correo_dueño || prev.email // Actualizamos con el de la BD
            }))
          }
      }

      // 3. Cargar SUCURSALES usando el ID del local (codigo_local)
      // Esta es la corrección clave para que vuelvan a aparecer
      const { data: dataSucursales, error: errorSucursales } = await supabase
        .from('sucursales')
        .select('*')
        .eq('codigo_local', dataLocal.id) // <--- Búsqueda por ID numérico
        .order('id', { ascending: true })

      if (!errorSucursales && dataSucursales) {
        setSucursales(dataSucursales)
      }

    } catch (err) {
      console.error("Error al cargar dashboard:", err)
    } finally {
      setCargando(false)
    }
  }

  const toggleEstadoMarca = async () => {
    if (!localData) return
    const nuevoEstado = localData.estado === 'activo' ? 'standby' : 'activo'
    
    const { error } = await supabase
      .from('locales')
      .update({ estado: nuevoEstado })
      .eq('id', localData.id)

    if (!error) {
      setLocalData({ ...localData, estado: nuevoEstado })
    } else {
      alert("Error al actualizar estado")
    }
  }

  const cerrarSesion = () => {
    localStorage.removeItem('sesion_dueño')
    router.push(`/${slug}/admin`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
             <img src="/logos/logo-agendalo.png" alt="Logo" className="h-20 object-contain" />
             <div className="h-14 w-[1px] bg-gray-200 hidden md:block"></div>
             <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter leading-none text-gray-800 italic">Panel de Control</h1>
                <div className="bg-blue-50 px-3 py-1.5 rounded-full flex items-center gap-2 border border-blue-100 mt-2">
                   <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Administrando Marca:</span>
                   <span className="text-[10px] font-black text-blue-600 uppercase italic tracking-tight">{localData?.nombre || slug}</span>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-6 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
            <div className="text-right">
              <span className="text-xs font-black uppercase text-gray-400 italic block">
                Hola, <span className="text-blue-600">{duenoInfo.nombre}</span>
              </span>
            </div>
            <button onClick={cerrarSesion} className="text-xs font-black uppercase text-red-500 bg-red-50 px-8 py-4 rounded-2xl hover:bg-red-100 transition-all border border-red-100 shadow-sm">
              Cerrar Sesión
            </button>
          </div>
        </header>

        {cargando ? (
          <div className="py-32 text-center animate-pulse font-black text-[10px] uppercase text-gray-300 tracking-[0.3em] italic">Sincronizando...</div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* 1. FICHA DE MARCA */}
            {localData && (
              <div className="bg-white p-4 rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden text-gray-900">
                <div className="w-full h-64 rounded-[3rem] overflow-hidden bg-gray-100 shadow-inner mb-8 border-4 border-white relative group">
                  <img src={localData.banner_general || localData.foto_banner} className="w-full h-full object-cover opacity-90" alt="Banner General" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-8 left-8 text-white">
                      <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase italic mb-2 inline-block border border-white/20 backdrop-blur-md ${localData.estado === 'activo' ? 'bg-green-500/80' : 'bg-orange-500/80'}`}>
                        {localData.estado === 'activo' ? 'Portal Activo' : 'Portal Standby'}
                      </span>
                      <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none shadow-black drop-shadow-lg">{localData.nombre}</h2>
                  </div>
                </div>

                <div className="px-8 pb-8">
                  {/* GRILLA EXACTA 4x2 - Elementos ordenados por celda */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-10 items-start">
                    
                    {/* --- FILA 1 --- */}
                    
                    {/* Celda 1.1: Email */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-gray-300 uppercase italic leading-none">Email Administrativo</span>
                        {/* AQUI ESTÁ LA CORRECCIÓN: Mostramos el email traído de la BD */}
                        <span className="text-xs font-bold text-gray-600 uppercase mt-1 truncate">{duenoInfo.email || 'No registrado'}</span>
                    </div>

                    {/* Celda 1.2: Teléfono */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-gray-300 uppercase italic leading-none">Teléfono</span>
                        <span className="text-xs font-bold text-gray-600 uppercase mt-1">
                          {duenoInfo.telefono || 'No registrado'}
                        </span>
                    </div>

                    {/* Celda 1.3: Rubro */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-gray-300 uppercase italic leading-none">Rubro / Categoría</span>
                        <span className="text-xs font-black text-blue-500 uppercase italic mt-1">{localData.rubro || 'General'}</span>
                    </div>

                    {/* Celda 1.4: Plan */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-gray-300 uppercase italic leading-none">Tu Plan Actual</span>
                        <div className="flex flex-col mt-1">
                          <span className="text-xs font-black text-purple-600 uppercase italic">
                             {localData.plan_nombre} 
                          </span>
                          <span className="text-[10px] font-bold text-gray-400">
                             {localData.plan_valor} / mes
                          </span>
                        </div>
                    </div>

                    {/* --- FILA 2 (Alineada justo abajo de la Fila 1) --- */}

                    {/* Celda 2.1: Descripción (Debajo de Email) */}
                    <div className="flex flex-col gap-1 border-t border-gray-50 pt-4 w-full">
                        <span className="text-[9px] font-black text-gray-300 uppercase italic leading-none block">Descripción de la Marca</span>
                        <p className="text-[10px] font-medium text-gray-500 uppercase leading-relaxed text-justify mt-1">
                          {localData.descripcion || 'Sin descripción corporativa.'}
                        </p>
                    </div>

                    {/* Celda 2.2: BOTÓN EDITAR (Debajo de Teléfono) */}
                    <div className="flex flex-col justify-start border-t border-gray-50 pt-4 w-full h-full">
                        <button 
                          onClick={() => router.push(`/${slug}/dashboard/editar-marca`)}
                          className="w-full bg-gray-100 text-gray-900 font-black text-[9px] uppercase py-3 px-4 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                        >
                          <span>⚙️</span> Editar Datos
                        </button>
                    </div>

                    {/* Celda 2.3: BOTÓN ESTADO (Debajo de Rubro) */}
                    <div className="flex flex-col justify-start border-t border-gray-50 pt-4 w-full h-full">
                        <button 
                          onClick={toggleEstadoMarca} 
                          className={`w-full font-black text-[9px] uppercase py-3 px-4 rounded-xl transition-all shadow-sm border flex items-center justify-center gap-2 ${localData.estado === 'activo' ? 'bg-orange-50 text-orange-500 border-orange-100 hover:bg-orange-100' : 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${localData.estado === 'activo' ? 'bg-orange-500' : 'bg-green-600'}`}></span>
                          {localData.estado === 'activo' ? 'Ocultar Pagina' : 'Activar Pagina'}
                        </button>
                    </div>

                    {/* Celda 2.4: LINK PORTAL (Debajo de Plan) */}
                    <div className="flex flex-col justify-start border-t border-gray-50 pt-4 w-full h-full">
                        <button 
                          onClick={() => window.open(`/${slug}`, '_blank')}
                          className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 border border-blue-100 px-3 py-3 rounded-xl transition-all group"
                        >
                          <span className="text-[9px] font-black uppercase italic tracking-tight">Ver Portal Público</span>
                          <span className="text-xs">↗</span>
                        </button>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* NAVEGACIÓN Y AGREGAR */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-2 p-1.5 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm w-full md:w-fit">
                  <button onClick={() => setTab('sucursales')} className={`px-10 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest transition-all ${tab === 'sucursales' ? 'bg-black text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'}`}>Sucursales</button>
                  <button onClick={() => setTab('profesionales')} className={`px-10 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest transition-all ${tab === 'profesionales' ? 'bg-black text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'}`}>Profesionales</button>
                </div>
                
                {tab === 'sucursales' && (
                  <button onClick={() => router.push(`/${slug}/dashboard/nueva-sucursal`)} className="w-full md:w-auto bg-green-500 text-white font-black text-xs uppercase py-5 px-10 rounded-2xl hover:bg-green-600 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2">
                    <span className="text-lg">+</span> Agregar Sucursal
                  </button>
                )}
            </div>

            {/* LISTADO SUCURSALES */}
            {tab === 'sucursales' && (
              <div className="space-y-8">
                {sucursales.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    {sucursales.map((sucursal: any) => (
                      <div key={sucursal.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-6 group hover:shadow-lg transition-all duration-300">
                        
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                          <div className="w-full md:w-56 h-36 rounded-[2rem] overflow-hidden bg-gray-100 shrink-0 border-2 border-white shadow-sm relative">
                            <img src={sucursal.banner_sucursal || '/placeholder.jpg'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Sucursal" />
                            <div className={`absolute bottom-2 left-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wide border shadow-sm ${sucursal.estado_sucursal === 'activo' ? 'bg-green-500 text-white border-green-400' : 'bg-orange-500 text-white border-orange-400'}`}>
                                {sucursal.estado_sucursal}
                            </div>
                          </div>

                          <div className="flex-1 w-full space-y-3">
                              <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{sucursal.nombre}</h3>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-4">
                                <div>
                                  <span className="text-[8px] font-black text-gray-300 uppercase block">Dirección</span>
                                  <span className="text-[10px] font-bold text-gray-600 block truncate">{sucursal.direccion_sucursal}</span>
                                </div>
                                <div>
                                  <span className="text-[8px] font-black text-gray-300 uppercase block">Teléfono</span>
                                  <span className="text-[10px] font-bold text-gray-600 block">{sucursal.telefono_sucursal}</span>
                                </div>
                                <div className="md:col-span-2">
                                  <span className="text-[8px] font-black text-gray-300 uppercase block">Email Sucursal</span>
                                  <span className="text-[10px] font-bold text-gray-600 block truncate">{sucursal.email_sucursal}</span>
                                </div>
                              </div>

                              <div className="pt-1">
                                  <a href={sucursal.url_maps_sucursal} target="_blank" className="inline-flex items-center gap-1 text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors">
                                    📍 Ver en Google Maps
                                  </a>
                              </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50">
                            <button className="flex-1 bg-black text-white font-black text-[10px] uppercase py-3 px-4 rounded-xl hover:bg-gray-800 shadow-md transition-all">
                              + Servicio
                            </button>
                            <button className="flex-1 bg-black text-white font-black text-[10px] uppercase py-3 px-4 rounded-xl hover:bg-gray-800 shadow-md transition-all">
                              + Producto
                            </button>
                            <button onClick={() => router.push(`/${slug}/dashboard/editar-sucursal/${sucursal.id}`)} className="flex-1 bg-gray-100 text-gray-900 font-black text-[10px] uppercase py-3 px-4 rounded-xl hover:bg-gray-200 transition-all">
                              Editar Datos
                            </button>
                            <button className={`flex-1 font-black text-[10px] uppercase py-3 px-4 rounded-xl transition-all shadow-sm border ${sucursal.estado_sucursal === 'activo' ? 'bg-orange-50 text-orange-500 border-orange-100 hover:bg-orange-100' : 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'}`}>
                              {sucursal.estado_sucursal === 'activo' ? 'Poner en Standby' : 'Activar'}
                            </button>
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-[3rem] bg-gray-50/50">
                    <p className="text-gray-400 font-bold uppercase text-xs mb-4">No tienes sucursales registradas</p>
                    <button onClick={() => router.push(`/${slug}/dashboard/nueva-sucursal`)} className="bg-green-500 text-white font-black text-xs uppercase py-3 px-6 rounded-xl hover:bg-green-600 transition-all shadow-lg">
                       Comenzar agregando la primera.
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 