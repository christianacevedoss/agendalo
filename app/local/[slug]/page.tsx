import { supabase } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

export default async function PaginaLocal({ params }: { params: { slug: string } }) {
  try {
    // Consultamos la tabla servicios filtrando por el slug de la URL
    const { data: servicios, error } = await supabase
      .from('servicios')
      .select('*')
      .eq('local_slug', params.slug)

    // Si Supabase devuelve un error técnico, lo lanzamos para atraparlo abajo
    if (error) throw error;

    // Si no hay servicios para ese slug, mostramos aviso amigable
    if (!servicios || servicios.length === 0) {
      return (
        <div className="p-10 text-center font-sans">
          <h1 className="text-xl text-gray-600">No encontramos servicios para "{params.slug}"</h1>
          <p className="text-sm text-gray-400 mt-2">Verifica el nombre en la base de datos.</p>
        </div>
      )
    }

    const nombreLocal = servicios[0].local

    return (
      <main className="min-h-screen p-8 bg-gray-50 font-sans">
        <h1 className="text-4xl font-bold text-center mb-2 text-blue-700 uppercase tracking-tight">
          {nombreLocal}
        </h1>
        <div className="h-1 w-20 bg-blue-500 mx-auto mb-10 rounded-full"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {servicios.map((servicio) => (
            <div key={servicio.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">{servicio.nombre}</h2>
              <p className="text-blue-600 font-black text-2xl mt-2">
                ${servicio.precio.toLocaleString('es-CL')}
              </p>
              <button className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">
                AGENDAR AHORA
              </button>
            </div>
          ))}
        </div>
      </main>
    )
  } catch (err: any) {
    // Si hay un error de servidor, lo mostramos aquí para diagnosticar
    return (
      <div className="p-10 bg-red-50 text-red-800 m-5 rounded-xl border border-red-200">
        <h2 className="font-bold">Error de Servidor:</h2>
        <p className="text-sm mt-2">{err.message || 'Error desconocido al conectar con Supabase'}</p>
      </div>
    )
  }
}