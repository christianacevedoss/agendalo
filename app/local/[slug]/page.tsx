import { supabase } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'
// 1. Esta función genera el título de la pestaña automáticamente
export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  // Convertimos el slug (peluqueria-juanito) en un nombre bonito (PELUQUERIA JUANITO)
  const nombreLimpio = params.slug.replace(/-/g, ' ').toUpperCase();
  
  return {
    title: `${nombreLimpio} | Agéndalo Talca`,
    description: `Reserva tu hora en ${nombreLimpio} a través de Agéndalo Talca.`
  };
}
// Definimos la estructura exacta para que TypeScript no se queje
interface Servicio {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  local: string;
  local_slug: string;
}

// En las versiones actuales, 'params' debe ser tratado como una Promesa
export default async function PaginaLocal(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const slug = params.slug;

  try {
    // Consulta a Supabase filtrando por la columna que creamos
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .eq('local_slug', slug);

    if (error) throw error;

    const servicios = data as Servicio[];

    // Si no hay datos, mostramos un mensaje limpio
    if (!servicios || servicios.length === 0) {
      return (
        <div className="p-20 text-center font-sans">
          <h1 className="text-2xl text-gray-400">Local "{slug}" no encontrado</h1>
        </div>
      );
    }

    const nombreLocal = servicios[0].local;

    return (
      <main className="min-h-screen p-8 bg-gray-50 font-sans">
        <h1 className="text-4xl font-extrabold text-center mb-12 text-blue-600 uppercase">
          {nombreLocal}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {servicios.map((servicio) => (
            <div key={servicio.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">{servicio.nombre}</h2>
              <p className="text-blue-500 font-black text-3xl mt-2">
                ${servicio.precio.toLocaleString('es-CL')}
              </p>
              <button className="w-full mt-8 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all">
                AGENDAR AHORA
              </button>
            </div>
          ))}
        </div>
      </main>
    );
  } catch (err: any) {
    // Si algo falla en el servidor, lo atrapamos aquí
    return (
      <div className="p-10 bg-red-50 text-red-700 m-10 rounded-2xl border border-red-100">
        <p className="font-bold">Error de conexión:</p>
        <code className="text-xs">{err.message}</code>
      </div>
    );
  }
}