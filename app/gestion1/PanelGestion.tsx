'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

// Definimos los tipos para que VS Code no marque errores
type EstadoReal = 'contactar' | 'activo' | 'standby' | 'papelera';
type TabEstado = 'todos' | EstadoReal;

const ESTADOS: TabEstado[] = ['todos', 'contactar', 'activo', 'standby', 'papelera'];

const NOMBRES_TABS: Record<TabEstado, string> = {
  'todos': 'Todos los Locales',
  'contactar': 'Contactar',
  'activo': 'Locales Activos',
  'standby': 'Oculto por el dueño',
  'papelera': 'Papelera'
};

export default function PanelGestion() {
  const router = useRouter()
  const [tab, setTab] = useState<TabEstado>('todos') 
  const [datos, setDatos] = useState<any[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [adminEmail, setAdminEmail] = useState('')
  
  const [fotosBanner, setFotosBanner] = useState<Record<string, string>>({})
  const [conteos, setConteos] = useState<Record<TabEstado, number>>({
    todos: 0, contactar: 0, activo: 0, standby: 0, papelera: 0
  })
  
  const [confirmacion, setConfirmacion] = useState<{item: any, nuevoEstado: EstadoReal} | null>(null)

  useEffect(() => { 
      fetchDatos()
      obtenerUsuario()
  }, [tab])

  async function obtenerUsuario() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setAdminEmail(user.email)
  }

  const handleLogout = async () => {
      await supabase.auth.signOut()
      window.location.reload()
  }

  async function fetchDatos() {
    setCargando(true)
    
    // 1. Traemos a los dueños
    const { data: todosLosDueños, error } = await supabase
      .from('dueño_local')
      .select('*')
      .order('id', { ascending: false })
    
    if (!error && todosLosDueños) {
      // 2. Traemos la info de los locales (Estado real y Banner)
      const { data: localesInfo } = await supabase
        .from('locales')
        .select('correo_dueño, foto_banner, estado')

      const mapaBanners: Record<string, string> = {}
      const mapaEstados: Record<string, string> = {}

      if (localesInfo) {
        localesInfo.forEach((l: any) => {
          if (l.correo_dueño) {
            mapaBanners[l.correo_dueño] = l.foto_banner
            mapaEstados[l.correo_dueño] = l.estado // Guardamos el estado real del local
          }
        })
        setFotosBanner(mapaBanners)
      }

      // 3. Sincronizamos: El estado del local manda sobre el estado del dueño
      const datosSincronizados = todosLosDueños.map(dueño => ({
        ...dueño,
        // Si el local tiene un estado (activo/standby), usamos ese. Si no, usamos el de dueño_local.
        estado: mapaEstados[dueño.correo_dueño] || dueño.estado 
      }))

      const counts = {
        todos: datosSincronizados.length,
        contactar: datosSincronizados.filter(d => d.estado === 'contactar').length,
        activo: datosSincronizados.filter(d => d.estado === 'activo').length,
        standby: datosSincronizados.filter(d => d.estado === 'standby').length,
        papelera: datosSincronizados.filter(d => d.estado === 'papelera').length,
      }
      
      setConteos(counts)
      // Filtramos la lista según la pestaña activa usando los datos ya sincronizados
      setDatos(tab === 'todos' ? datosSincronizados : datosSincronizados.filter(d => d.estado === tab))
    }
    setCargando(false)
  }

  const datosFiltrados = datos.filter(i => 
    i.nombre_local?.toLowerCase().includes(busqueda.toLowerCase()) || 
    i.nombre_dueño?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const solicitarCambio = (item: any, nuevoEstado: EstadoReal) => {
      setConfirmacion({ item, nuevoEstado })
  }

  const ejecutarCambio = async () => {
      if (!confirmacion) return;
      const { item, nuevoEstado } = confirmacion;
      try {
        await supabase.from('locales').update({ estado: nuevoEstado }).eq('correo_dueño', item.correo_dueño);
        fetchDatos();
        setConfirmacion(null);
      } catch (e: any) { alert(e.message) }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER CON SESIÓN RESTAURADA */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Admin Agéndalo</h1>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest italic mt-1">Panel de Control Global</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-center">
             {/* PERFIL ADMIN RESTAURADO */}
             <div className="bg-white border border-gray-100 rounded-[2rem] p-2 pr-6 pl-2 flex items-center gap-4 shadow-sm w-full md:w-auto justify-between md:justify-start">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-xs">
                        {adminEmail.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Hola, Admin</span>
                        <span className="text-xs font-black truncate max-w-[120px]">{adminEmail}</span>
                    </div>
                </div>
                <button onClick={handleLogout} className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase border-l pl-4 ml-2">
                    Salir
                </button>
             </div>

             <div className="relative group w-full md:w-80">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">🔍</span>
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="w-full bg-white pl-12 pr-6 py-4 rounded-[2rem] border border-gray-100 font-bold text-sm shadow-sm outline-none focus:ring-4 ring-blue-50 transition-all" 
                  onChange={(e) => setBusqueda(e.target.value)} 
                />
             </div>
          </div>
        </header>

        {/* TABS Y BOTÓN */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-[2rem] border border-gray-100 shadow-sm w-full lg:w-fit overflow-x-auto">
              {ESTADOS.map((e) => (
                <button key={e} onClick={() => setTab(e)} 
                  className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-wide transition-all flex items-center gap-2 ${tab === e ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
                  {NOMBRES_TABS[e]}
                  <span className={`px-2 py-0.5 rounded-full text-[9px] ${tab === e ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {conteos[e]}
                  </span>
                </button>
              ))}
            </div>

            <button 
                onClick={() => router.push('/gestion1/nuevo')} 
                className="w-full lg:w-auto bg-black text-white px-8 py-4 rounded-[2rem] font-black text-xs uppercase shadow-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-3 whitespace-nowrap"
             >
               <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">+</span>
               Ingresa Nuevo Dueño y Local
            </button>
        </div>

        {/* LISTADO */}
        <div className="grid grid-cols-1 gap-4">
          {cargando ? (
            <div className="text-center py-32 opacity-50 animate-pulse font-black text-xs uppercase text-gray-300">Sincronizando...</div>
          ) : (
            datosFiltrados.map(item => (
              <div key={item.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row justify-between items-center gap-6 group">
                
                <div className="flex items-center gap-6 flex-1 w-full">
                   <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg shrink-0 overflow-hidden bg-gray-200">
                      {fotosBanner[item.correo_dueño] ? (
                        <img src={fotosBanner[item.correo_dueño]} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${item.plan === 'Gratis' ? 'bg-gray-300' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}>
                           {item.nombre_local?.charAt(0).toUpperCase()}
                        </div>
                      )}
                   </div>

                   <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black tracking-tight truncate">{item.nombre_local}</h3>
                        {item.estado === 'activo' && (
                           <button onClick={() => window.open(`/${item.nombre_local.toLowerCase().replace(/\s+/g, '-')}`, '_blank')} className="text-blue-500 hover:scale-125 transition-transform">👁️</button>
                        )}
                        {tab === 'todos' && (
                            <span className="text-[8px] bg-gray-100 text-gray-400 px-2 py-1 rounded font-bold uppercase">{item.estado}</span>
                        )}
                      </div>
                      <div className="flex flex-col md:flex-row gap-1 md:gap-4 text-xs text-gray-400 font-bold mt-1">
                          <span className="text-gray-900 font-bold">👤 {item.nombre_dueño}</span>
                          <span className="truncate">✉️ {item.correo_dueño}</span>
                          <span className="text-blue-400">📅 {item.time_insert ? new Date(item.time_insert).toLocaleDateString('es-CL') : 'Sin fecha'}</span>
                      </div>
                   </div>
                </div>

                <div className="flex flex-wrap justify-center lg:justify-end gap-2 w-full lg:w-auto">
                  <button onClick={() => router.push(`/gestion1/editar/${item.id}`)} className="bg-gray-50 text-gray-600 px-4 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-gray-100 transition-colors">Editar</button>
                  
                  {/* BOTÓN CONTACTAR RESTAURADO */}
                  {item.estado !== 'activo' && item.estado !== 'papelera' && <button onClick={() => solicitarCambio(item, 'activo')} className="bg-green-500 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-green-100 hover:scale-105 transition-transform">✔ Activar</button>}
                  {item.estado === 'activo' && <button onClick={() => solicitarCambio(item, 'standby')} className="bg-orange-100 text-orange-600 px-5 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-orange-200 transition-colors">Ocultar</button>}
                  {item.estado !== 'contactar' && item.estado !== 'papelera' && <button onClick={() => solicitarCambio(item, 'contactar')} className="border border-blue-100 text-blue-400 px-4 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-blue-50 transition-colors">Contactar</button>}
                  
                  {item.estado !== 'papelera' ? (
                      <button onClick={() => solicitarCambio(item, 'papelera')} className="bg-white border-2 border-red-50 text-red-300 px-4 py-3 rounded-2xl font-black text-[10px] uppercase hover:text-red-500 transition-colors">Papelera</button>
                  ) : (
                      <button onClick={() => solicitarCambio(item, 'contactar')} className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-blue-100">Restaurar</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {confirmacion && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-center">
                    <h3 className="text-xl font-black italic uppercase mb-2">¿Confirmar cambio?</h3>
                    <p className="text-sm text-gray-500 mb-8 font-medium">Vas a mover el local <span className="text-black font-bold">"{confirmacion.item.nombre_local}"</span> a <span className="text-blue-600 font-bold uppercase">{NOMBRES_TABS[confirmacion.nuevoEstado]}</span>.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setConfirmacion(null)} className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-xl uppercase text-[10px] hover:bg-gray-200 transition-colors">Cancelar</button>
                        <button onClick={ejecutarCambio} className="flex-1 bg-black text-white font-black py-4 rounded-xl uppercase text-[10px] hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200">Confirmar</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  )
}