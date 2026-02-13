'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import PanelGestion from './PanelGestion'

export default function PaginaGestion() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sesion, setSesion] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // ESTO ES NUEVO: Verifica si ya estás logueado al entrar
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSesion(session)
      setLoading(false)
    }
    checkSession()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
        setError('Acceso denegado. Revisa tus credenciales.')
    } else {
        setSesion(data.session)
    }
  }

  // Evita parpadeos mientras carga
  if (loading) return null

  // Si hay sesión, muestra el panel
  if (sesion) return <PanelGestion />

  // Si no, muestra el LOGIN OSCURO
  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6 font-sans">
      <div className="max-w-md w-full bg-gray-900 p-10 rounded-[2.5rem] border border-gray-800 shadow-2xl">
        
        <div className="text-center mb-8">
            {/* Asegúrate de tener esta imagen en public/logos/ o borra la línea si no la tienes */}
            {/* <img src="/logos/logo-agendalo.png" className="w-32 mx-auto mb-4" alt="Logo" /> */}
            
            <h1 className="text-white text-3xl font-black italic tracking-tighter uppercase mb-2">Panel de Control</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Solo personal autorizado</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
             <input 
                type="email" 
                placeholder="Correo" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 focus:bg-white/10 transition-all font-bold text-sm"
                onChange={(e) => setEmail(e.target.value)}
             />
          </div>
          
          <div className="space-y-1">
             <input 
                type="password" 
                placeholder="Contraseña" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 focus:bg-white/10 transition-all font-bold text-sm"
                onChange={(e) => setPassword(e.target.value)}
             />
          </div>

          {error && <p className="text-red-500 text-xs font-bold text-center animate-pulse bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}
          
          <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all uppercase tracking-widest text-xs shadow-lg shadow-blue-900/20 mt-4">
            Ingresar al sistema
          </button>
        </form>
      </div>
    </main>
  )
}