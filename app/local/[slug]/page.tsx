import { supabase } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

// Definimos la interfaz para evitar errores de tipo "any"
interface Servicio {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  local: string;
  local_slug: string;
}

// Next.js requiere que 'params' sea una Promesa en versiones recientes
export default async function PaginaLocal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; // Extraemos el slug correctamente

  try {
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .eq('local_slug', slug)

    if (error) throw error;

    const servicios = data as Servicio[];

    if (!servicios || servicios.length === 0) {
      return (
        <div className="p-10 text-center font-sans">
          <h1 className="text-xl text-gray-600">No hay servicios para "{slug}"</h1>
        </div>
      )
    }

    const nombreLocal = servicios[0].local

    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <h1 className="text-4xl font-bold text-center mb-10 text-blue-700 uppercase">
          {nombreLocal}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {servicios.map((servicio) => (
            <div key={servicio.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">{servicio.nombre}</h2>
              <p className="text-blue-600 font-black text-2xl mt-2">
                ${servicio.precio.toLocaleString('es-CL')}
              </p>
              <button className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-bold">
                AGENDAR AHORA
              </button>
            </div>
          ))}
        </div>
      </main>
    )
  } catch (err: any) {
    return (
      <div className="p-10 bg-red-50 text-red-800 m-5 rounded-xl border border-red-200">
        <h2 className="font-bold">Error de Conexión:</h2>
        <p className="text-sm mt-2">{err.message}</p>
      </div>
    )
  }
}