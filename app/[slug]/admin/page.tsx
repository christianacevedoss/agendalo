'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface LocalData {
  correo_dueño: string | null;
  slug: string;
}

export default function LoginControl() {
  const router = useRouter()
  const params = useParams()
  const slugParam = params.slug 
  
  const [email, setInEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError('')

    const emailLimpio = email.trim().toLowerCase();

    try {
      // 1. Validar Dueño
      const { data: duenio, error: errorDuenio } = await supabase
        .from('dueño_local')
        .select('*')
        .eq('correo_dueño', emailLimpio)
        .single()

      if (errorDuenio || !duenio) {
        setError('Usuario no registrado.');
        setCargando(false)
        return
      }

      if (password !== '123') {
        setError('Contraseña incorrecta.');
        setCargando(false)
        return
      }

      // 2. Validar vínculo usando la columna 'slug'
      const { data, error: errorLocal } = await supabase
        .from('locales')
        .select('correo_dueño, slug')
        .eq('slug', slugParam)
        .single()

      const local = data as unknown as LocalData;

      if (errorLocal || !local) {
        setError(`No existe el local: ${slugParam}`);
        setCargando(false)
        return
      }

      if (local.correo_dueño?.trim().toLowerCase() !== emailLimpio) {
        setError('No tienes permisos para este local.');
        setCargando(false)
        return
      }

      // Guardar sesión y saltar al dashboard
      localStorage.setItem('sesion_dueño', JSON.stringify({ email: emailLimpio, slug: slugParam }))
      router.push(`/${slugParam}/dashboard`)

    } catch (err) {
      setError('Error de conexión.');
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-xl border border-gray-100 text-center">
        
        {/* LOGO GRANDE */}
        <img 
          src="/logos/logo-agendalo.png" 
          alt="Agéndalo" 
          className="h-28 mx-auto mb-6 object-contain" 
        />
        
        {/* TÍTULOS ORIGINALES */}
        <h1 className="text-xl font-black uppercase tracking-tighter text-gray-800 leading-none">
          Panel de Control
        </h1>
        
        <div className="bg-blue-50 px-5 py-2 rounded-full inline-flex items-center gap-2 border border-blue-100 my-4">
           <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none">
             Administrando:
           </span>
           <span className="text-[11px] font-black text-blue-600 uppercase italic leading-none">
             {slugParam}
           </span>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-left mt-6">
          <input 
            type="email" 
            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-sm shadow-inner outline-none focus:ring-2 ring-blue-100 text-gray-600"
            placeholder="Correo del dueño"
            value={email}
            onChange={(e) => setInEmail(e.target.value)}
          />
          <input 
            type="password" 
            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-sm shadow-inner outline-none focus:ring-2 ring-blue-100 text-gray-600"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <div className="bg-red-50 p-4 rounded-2xl text-[10px] text-red-600 font-bold uppercase text-center leading-tight">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={cargando}
            className="w-full bg-black text-white font-black py-5 rounded-2xl uppercase text-xs shadow-lg hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-50 mt-2"
          >
            {cargando ? 'Verificando...' : 'Ingresar al Panel'}
          </button>
        </form>
      </div>
    </div>
  )
}