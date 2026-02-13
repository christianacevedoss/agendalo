'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NuevaSucursal() {
  const { slug } = useParams()
  const router = useRouter()
  const [enviando, setEnviando] = useState(false)
  const [datosDueño, setDatosDueño] = useState<{email: string} | null>(null)
  const [mostrarExito, setMostrarExito] = useState(false)

  // 1. ELIMINADA descripcion_sucursal DEL ESTADO INICIAL
  const [formData, setFormData] = useState({
    nombre: '',               
    email_sucursal: '',       
    telefono_sucursal: '',    
    direccion_sucursal: '',   
    url_maps_sucursal: '',    
    estado_sucursal: 'activo' 
  })

  const [errores, setErrores] = useState<Record<string, string>>({})
  const [archivo, setArchivo] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    const cargarSesion = () => {
      const sesionStr = localStorage.getItem('sesion_dueño')
      if (!sesionStr) {
        router.push(`/${slug}/admin`)
        return
      }
      const sesion = JSON.parse(sesionStr)
      setDatosDueño({ email: sesion.email })
    }
    cargarSesion()
  }, [slug])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errores[e.target.name]) {
      setErrores({ ...errores, [e.target.name]: '' })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen es muy pesada. Máximo 5MB.")
        return
      }
      setArchivo(file)
      setPreviewUrl(URL.createObjectURL(file))
      if (errores.archivo) setErrores({ ...errores, archivo: '' })
    }
  }

  const validarFormulario = () => {
    const nuevosErrores: Record<string, string> = {}

    if (!formData.nombre.trim()) nuevosErrores.nombre = "Nombre obligatorio."
    
    if (!formData.email_sucursal.trim()) {
        nuevosErrores.email_sucursal = "Email obligatorio."
    } else if (!/\S+@\S+\.\S+/.test(formData.email_sucursal)) {
        nuevosErrores.email_sucursal = "Formato de email inválido."
    }

    if (!formData.direccion_sucursal.trim()) nuevosErrores.direccion_sucursal = "Dirección obligatoria."
    
    if (!formData.telefono_sucursal) {
        nuevosErrores.telefono_sucursal = "Teléfono obligatorio."
    } else if (!/^\d{8}$/.test(formData.telefono_sucursal)) {
        nuevosErrores.telefono_sucursal = "Debe tener 8 dígitos (ej: 98765432)"
    }

    if (!formData.url_maps_sucursal.trim()) nuevosErrores.url_maps_sucursal = "URL de Maps obligatoria."
    
    // 2. ELIMINADA VALIDACIÓN DE DESCRIPCIÓN FANTASMA
    
    if (!archivo) nuevosErrores.archivo = "Debes subir una foto de portada."

    setErrores(nuevosErrores)
    // Esto retorna true si NO hay errores
    return Object.keys(nuevosErrores).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!datosDueño) return
    
    // Si la validación falla, se detiene aquí. Ahora que sacamos la descripción, debería pasar.
    if (!validarFormulario()) return

    setEnviando(true)

    try {
      const nombreArchivo = `sucursal-${Date.now()}-${archivo!.name}`
      const { error: uploadError } = await supabase
        .storage
        .from('locales')
        .upload(nombreArchivo, archivo!)

      if (uploadError) throw uploadError
      
      const { data: publicUrlData } = supabase
        .storage
        .from('locales')
        .getPublicUrl(nombreArchivo)
        
      const urlFoto = publicUrlData.publicUrl

      const { error } = await supabase
        .from('sucursales')
        .insert([{
          nombre: formData.nombre,
          email_sucursal: formData.email_sucursal,
          telefono_sucursal: formData.telefono_sucursal,
          direccion_sucursal: formData.direccion_sucursal,
          url_maps_sucursal: formData.url_maps_sucursal,
          banner_sucursal: urlFoto,
          // 3. ELIMINADO CAMPO descripcion_sucursal DEL INSERT
          estado_sucursal: formData.estado_sucursal,
          insert_by: datosDueño.email,
        }])

      if (error) throw error
      
      setMostrarExito(true)

    } catch (err: any) {
      console.error(err)
      alert("Error: " + err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans text-gray-900 flex justify-center">
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 md:p-12 relative">
        
        <div className="flex justify-between items-center mb-8">
           <h1 className="text-2xl font-black uppercase italic tracking-tighter">Agregar Sucursal</h1>
           <button onClick={() => router.back()} className="text-[10px] font-bold uppercase text-gray-400 hover:text-black">Cancelar</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase">Nombre Sucursal <span className="text-red-500">*</span></label>
              <input name="nombre" onChange={handleChange} className={`bg-gray-50 border p-4 rounded-2xl text-sm font-bold placeholder-gray-300 focus:ring-2 ring-blue-100 outline-none ${errores.nombre ? 'border-red-500 bg-red-50' : 'border-gray-100'}`} placeholder="Ej: Local Centro" />
              {errores.nombre && <span className="text-[9px] font-black text-red-500 uppercase">{errores.nombre}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase">Email Sucursal <span className="text-red-500">*</span></label>
              <input name="email_sucursal" type="email" onChange={handleChange} className={`bg-gray-50 border p-4 rounded-2xl text-sm font-bold placeholder-gray-300 focus:ring-2 ring-blue-100 outline-none ${errores.email_sucursal ? 'border-red-500 bg-red-50' : 'border-gray-100'}`} placeholder="contacto@sucursal.cl" />
              {errores.email_sucursal && <span className="text-[9px] font-black text-red-500 uppercase">{errores.email_sucursal}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase">Ruta Visual</label>
              <div className="bg-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-400 select-none flex items-center gap-1">
                <span className="opacity-50">agendalo.cl/</span>
                <span className="text-blue-500">{slug}</span>
              </div>
              <p className="text-[9px] text-gray-400 italic px-1">Se mostrará dentro de tu web principal.</p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase">Tel. Sucursal (8 dígitos) <span className="text-red-500">*</span></label>
              <div className={`flex items-center bg-gray-50 rounded-2xl overflow-hidden border focus-within:ring-2 ring-blue-100 ${errores.telefono_sucursal ? 'border-red-500 bg-red-50' : 'border-gray-100'}`}>
                 <span className="pl-4 text-xs font-black text-gray-400">+56 9</span>
                 <input name="telefono_sucursal" type="tel" maxLength={8} onChange={handleChange} className="bg-transparent border-none p-4 text-sm font-bold placeholder-gray-300 outline-none w-full" placeholder="12345678" />
              </div>
              {errores.telefono_sucursal && <span className="text-[9px] font-black text-red-500 uppercase">{errores.telefono_sucursal}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase">Dirección Sucursal <span className="text-red-500">*</span></label>
            <input name="direccion_sucursal" onChange={handleChange} className={`bg-gray-50 border p-4 rounded-2xl text-sm font-bold placeholder-gray-300 focus:ring-2 ring-blue-100 outline-none ${errores.direccion_sucursal ? 'border-red-500 bg-red-50' : 'border-gray-100'}`} placeholder="Ej: Calle 1 Norte #123, Talca" />
            {errores.direccion_sucursal && <span className="text-[9px] font-black text-red-500 uppercase">{errores.direccion_sucursal}</span>}
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="flex flex-col gap-2">
               <label className="text-[10px] font-black text-gray-400 uppercase">Google Maps URL <span className="text-red-500">*</span></label>
               <input name="url_maps_sucursal" onChange={handleChange} className={`bg-gray-50 border p-4 rounded-2xl text-sm font-bold placeholder-gray-300 focus:ring-2 ring-blue-100 outline-none ${errores.url_maps_sucursal ? 'border-red-500 bg-red-50' : 'border-gray-100'}`} placeholder="Pegar link de Google Maps aquí" />
               {errores.url_maps_sucursal && <span className="text-[9px] font-black text-red-500 uppercase">{errores.url_maps_sucursal}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase">Banner Sucursal <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-4">
                 <label className={`bg-blue-50 text-blue-600 font-bold text-xs px-6 py-3 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors shadow-sm ${errores.archivo ? 'ring-2 ring-red-500 bg-red-50 text-red-500' : ''}`}>
                    Seleccionar archivo
                    <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                 </label>
                 <span className="text-xs text-gray-400 truncate max-w-[150px]">{archivo ? archivo.name : 'Ningún archivo seleccionado'}</span>
              </div>
              {errores.archivo && <span className="text-[9px] font-black text-red-500 uppercase">{errores.archivo}</span>}

              {previewUrl && (
                <div className="mt-4 w-full h-48 rounded-2xl overflow-hidden shadow-md border border-gray-100 relative group">
                  <img src={previewUrl} alt="Vista previa" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => {setArchivo(null); setPreviewUrl(null)}} className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full font-black flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">X</button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-[2rem] flex justify-between items-center">
            <div>
              <h3 className="font-black uppercase text-sm">Visible en el Portal</h3>
              <p className="text-[10px] text-gray-400 font-bold mt-1">Si desactivas, la sucursal quedará en Standby.</p>
            </div>
            <button type="button" onClick={() => setFormData({...formData, estado_sucursal: formData.estado_sucursal === 'activo' ? 'standby' : 'activo'})} className={`w-14 h-8 rounded-full p-1 transition-colors ${formData.estado_sucursal === 'activo' ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${formData.estado_sucursal === 'activo' ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <button type="submit" disabled={enviando} className="w-full bg-black text-white font-black uppercase text-xs py-5 rounded-2xl hover:bg-gray-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {enviando ? 'Guardando...' : 'Confirmar y Agregar Sucursal'}
          </button>
        </form>

        {mostrarExito && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm text-green-500">
                   ✓
                </div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2">¡Sucursal Creada!</h2>
                <p className="text-xs text-gray-500 font-bold mb-8 leading-relaxed">
                   La sucursal ha sido agregada exitosamente y ya está visible en tu panel.
                </p>
                <button onClick={() => router.push(`/${slug}/dashboard`)} className="w-full bg-black text-white font-black uppercase text-xs py-4 rounded-xl hover:bg-gray-800 transition-all shadow-lg">
                  Volver al Dashboard
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}