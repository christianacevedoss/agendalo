import { supabase } from '@/lib/supabase'

export default async function Home() {
  // Traemos los servicios desde PostgreSQL
  const { data: servicios, error } = await supabase
    .from('servicios')
    .select('*')

  if (error) {
    return <div className="p-10">Error al cargar servicios: {error.message}</div>
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-center mb-10 text-blue-600">
        Agéndalo - Servicios Disponibles
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {servicios?.map((servicio) => (
          <div key={servicio.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">{servicio.nombre}</h2>
            <p className="text-blue-500 font-bold mt-2">${servicio.precio.toLocaleString('es-CL')}</p>
            <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded">{servicio.categoria}</span>
              <span className="italic">{servicio.local}</span>
            </div>
            <button className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
              Agendar Bloque
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}