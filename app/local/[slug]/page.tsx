import { supabase } from '../../../lib/supabase' // Subimos 3 niveles: [slug] -> local -> app

export const dynamic = 'force-dynamic'

export default async function PaginaLocal({ params }: { params: { slug: string } }) {
  // Buscamos los servicios que pertenecen a este local específico usando el slug
  const { data: servicios, error } = await supabase
    .from('servicios')
    .select('*')
    .eq('local_slug', params.slug)

  // Si el link no existe o no tiene servicios, mostramos aviso
  if (error || !servicios || servicios.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium text-lg">Este local aún no tiene servicios disponibles.</p>
      </div>
    )
  }

  const nombreLocal = servicios[0].local

  return (
    <main className="min-h-screen p-8 bg-white">
      {/* Título dinámico que cambia según el local */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-extrabold text-blue-700 uppercase tracking-tight">
          {nombreLocal}
        </h1>
        <div className="h-1 w-20 bg-blue-500 mx-auto mt-4 rounded-full"></div>
        <p className="mt-4 text-gray-600">Reserva tu servicio en línea de forma rápida.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {servicios.map((servicio) => (
          <div key={servicio.id} className="p-6 border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition">
            <h2 className="text-xl font-bold text-gray-800">{servicio.nombre}</h2>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-500 bg-blue-50 px-2 py-1 rounded">
              {servicio.categoria}
            </span>
            <p className="text-3xl font-black text-gray-900 mt-4">
              ${servicio.precio.toLocaleString('es-CL')}
            </p>
            <button className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition transform active:scale-95">
              AGENDAR CITA
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}