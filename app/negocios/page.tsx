'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

interface Plan {
  id: number;
  nombre: string;
  descripcion: string;
  valor: number;
}

const FeatureCard = ({ icon, title, description }: { icon: string, title: string, description: string }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
    <div className="w-14 h-14 bg-blue-50 text-3xl flex items-center justify-center rounded-2xl mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
      {icon}
    </div>
    <h3 className="text-xl font-black text-gray-900 mb-3 leading-tight">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
  </div>
);

export default function NegociosPage() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pagarAltiro, setPagarAltiro] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviadoExitoso, setEnviadoExitoso] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre_dueño: '',
    nombre_local: '',
    correo_dueño: '',
    telefono_dueño: '',
    planId: ''
  });

  useEffect(() => {
    async function cargarPlanes() {
      try {
        const { data, error } = await supabase.from('planes').select('*').order('valor', { ascending: true });
        if (data) setPlanes(data);
      } catch (error) {
        console.error("Error cargando planes:", error);
      }
    }
    cargarPlanes();
  }, []);

  const planSeleccionado = planes.find(p => p.id.toString() === formData.planId);

  // Validar y limpiar teléfono (solo 8 dígitos)
  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
    setFormData({...formData, telefono_dueño: val});
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setEnviando(true);

    const nombrePlan = planSeleccionado ? planSeleccionado.nombre : 'No seleccionado';
    const telefonoCompleto = `+569${formData.telefono_dueño}`;

    try {
      const { error } = await supabase.from('dueño_local').insert([
        {
          nombre_dueño: formData.nombre_dueño,
          nombre_local: formData.nombre_local,
          correo_dueño: formData.correo_dueño,
          telefono_dueño: telefonoCompleto,
          plan: nombrePlan,
          estado: pagarAltiro ? 'activo' : 'contactar'
        }
      ]);

      if (!error) {
        setEnviadoExitoso(true);
      } else {
        alert("Error al guardar. Revisa los datos.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      
      {/* --- HEADER --- */}
      <div className="bg-black pt-6 pb-12 px-6 rounded-b-[3rem] relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-20 flex items-start justify-between h-20">
            <Link href="/" className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity group relative z-30 mt-2">
                <span className="bg-white/10 p-2 rounded-full group-hover:bg-white/20 transition-colors">⬅️</span>
                <span className="text-white font-bold text-sm hidden md:inline">Volver</span>
            </Link>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 z-20">
                 <img src="/logos/logo-agendalo.png" alt="Logo" className="w-28 h-28 md:w-40 md:h-40 object-contain drop-shadow-2xl" />
            </div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-8 md:gap-12 mt-4 md:mt-8">
          <div className="flex-1 text-center md:text-left pt-4 md:pt-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-none tracking-tight text-white mb-6">
              ¡Haz crecer <br/>
              <span className="text-blue-500">tu negocio!</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8 max-w-md mx-auto md:mx-0 leading-relaxed">
              Agenda, administración y posicionamiento en un solo lugar. La herramienta todo-en-uno para barberías, salones y clínicas en Talca.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button 
                onClick={() => {
                  setMostrarFormulario(true);
                  document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-blue-600 text-white font-bold text-lg px-8 py-3 rounded-full hover:bg-blue-700 hover:scale-105 hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                🚀 Empezar ahora
              </button>
              <Link href="#features" className="bg-white/10 text-white font-bold text-sm px-8 py-3 rounded-full hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all flex items-center justify-center">
                Ver beneficios ↓
              </Link>
            </div>
          </div>
          {/* Cuadro visual Derecha */}
          <div className="w-full max-w-xs md:max-w-xs relative mt-8 md:mt-0 flex justify-center md:justify-end">
             <div className="absolute inset-0 bg-blue-600 blur-[80px] opacity-30 rounded-full pointer-events-none"></div>
             <div className="relative bg-gradient-to-tr from-blue-600 to-purple-600 p-1 rounded-[2.5rem] rotate-3 hover:rotate-0 transition-all duration-500 shadow-2xl w-full">
                <div className="bg-gray-900 rounded-[2.3rem] p-8 h-64 flex flex-col items-center justify-center text-center overflow-hidden">
                    <span className="text-5xl mb-4 animate-bounce">📈</span>
                    <h3 className="text-white text-2xl font-black leading-tight">Tu Agenda<br/>Llena 24/7</h3>
                    <p className="text-blue-200 text-sm mt-3 font-medium">Sin llamadas ni mensajes.</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN BENEFICIOS (Igual) --- */}
      <div id="features" className="max-w-6xl mx-auto px-6 py-16 relative z-20">
        <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-3">Todo lo que necesitas para escalar.</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Olvídate del papel y el WhatsApp. Moderniza tu negocio.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard icon="📅" title="Agenda Digital 24/7" description="Tus clientes reservan solos. Adiós a los mensajes a medianoche." />
          <FeatureCard icon="💳" title="Cobros Online" description="Asegura tus ingresos. Permite el pago anticipado para reducir inasistencias." />
          <FeatureCard icon="📊" title="Análisis de Datos" description="Entiende tus números: ¿Cuál es tu servicio estrella? ¿Quién es tu mejor cliente?" />
          <FeatureCard icon="🎯" title="Solo Ejecuta" description="El sistema se encarga de la organización. Tú dedícate 100% a tu servicio." />
        </div>
      </div>

      {/* --- FORMULARIO Y CONFIRMACIÓN --- */}
      <div id="contacto" className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden border border-gray-800 transition-all duration-700">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

            {enviadoExitoso ? (
                // --- MENSAJE DE ÉXITO ESTÉTICO ---
                <div className="relative z-10 text-center py-10 animate-fadeIn">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/40">
                        <span className="text-4xl">✅</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black mb-4">¡Registro Recibido!</h2>
                    <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
                        {pagarAltiro 
                            ? "Estamos preparando tu acceso. Serás redirigido al pago en unos segundos..." 
                            : `¡Perfecto ${formData.nombre_dueño}! Nos pondremos en contacto contigo a la brevedad para activar tu local.`
                        }
                    </p>
                    <button 
                        onClick={() => { setEnviadoExitoso(false); setMostrarFormulario(false); }}
                        className="text-blue-400 font-bold hover:underline"
                    >
                        ← Volver a la página
                    </button>
                </div>
            ) : !mostrarFormulario ? (
                <div className="relative z-10 text-center">
                    <h2 className="text-3xl md:text-5xl font-black mb-4">¿Listo para llenar tu agenda?</h2>
                    <button 
                        onClick={() => setMostrarFormulario(true)}
                        className="bg-white text-blue-900 font-black text-xl px-10 py-4 rounded-full hover:scale-105 transition-all shadow-lg"
                    >
                        🚀 ¡Empezar Ahora!
                    </button>
                </div>
            ) : (
                <div className="relative z-10 max-w-lg mx-auto animate-fadeIn">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold">Configura tu cuenta</h3>
                        <p className="text-gray-400 text-sm">Completa los datos para tu nuevo local.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                type="text" required placeholder="Tu Nombre (Dueño)" 
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                                onChange={(e) => setFormData({...formData, nombre_dueño: e.target.value})}
                            />
                            <input 
                                type="text" required placeholder="Nombre del Local" 
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                                onChange={(e) => setFormData({...formData, nombre_local: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                type="email" required placeholder="Correo personal" 
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                                onChange={(e) => setFormData({...formData, correo_dueño: e.target.value})}
                            />
                            {/* TELÉFONO CON PREFIJO +56 9 */}
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold border-r border-white/10 pr-2">
                                    +56 9
                                </span>
                                <input 
                                    type="tel" required placeholder="1234 5678" 
                                    value={formData.telefono_dueño}
                                    onChange={handleTelefonoChange}
                                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-20 pr-4 py-3 text-white focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <select 
                            required 
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white outline-none cursor-pointer"
                            onChange={(e) => setFormData({...formData, planId: e.target.value})}
                        >
                            <option value="" className="bg-gray-900 text-gray-500">Selecciona un plan</option>
                            {planes.map(plan => (
                                <option key={plan.id} value={plan.id} className="bg-gray-900 text-white">
                                    {plan.nombre} - ${plan.valor.toLocaleString('es-CL')}
                                </option>
                            ))}
                        </select>

                        {planSeleccionado && (
                            <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4 text-sm animate-fade-in-down">
                                <span className="text-blue-300 font-bold block mb-1">INCLUYE:</span>
                                {planSeleccionado.descripcion}
                            </div>
                        )}

                        <div 
                            className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer select-none transition-all
                                ${pagarAltiro ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/10'}
                            `}
                            onClick={() => setPagarAltiro(!pagarAltiro)}
                        >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${pagarAltiro ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
                                {pagarAltiro && <span className="text-white text-[10px]">✓</span>}
                            </div>
                            <span className="text-sm font-bold">Quiero registrarme y pagar al tiro</span>
                        </div>

                        <button 
                            type="submit" disabled={enviando}
                            className={`w-full font-black text-lg py-4 rounded-xl shadow-lg transition-all transform active:scale-95
                                ${pagarAltiro ? 'bg-green-600 text-white' : 'bg-white text-blue-900'}
                                ${enviando ? 'opacity-50' : ''}
                            `}
                        >
                            {enviando ? '⏳ Guardando...' : (pagarAltiro ? '💳 Pagar y Activar' : '📞 Contáctenme')}
                        </button>
                    </form>
                </div>
            )}
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="mt-10 py-10 text-center border-t border-gray-100 bg-gray-50">
        <img src="/logos/logo-agendalo.png" className="w-48 h-48 mx-auto opacity-80 grayscale" alt="Logo" />
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} Agéndalo Talca.</p>
      </footer>
    </main>
  )
}