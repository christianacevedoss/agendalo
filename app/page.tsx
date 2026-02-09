// Importamos la conexión que creamos en la carpeta lib
import { supabase } from '../lib/supabase'

// Esta línea es VITAL: obliga a Vercel a consultar la base de datos cada vez 
// que alguien entra a la web, en lugar de hacerlo solo al momento de compilar.
export const dynamic = 'force-dynamic'

// Definimos la "forma" de los datos que vienen de la tabla 'servicios'.
// Esto evita errores de TypeScript durante el Build en Vercel.
interface Servicio {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  local: string;
}

export default async function Home() {
  // Realizamos la consulta a la tabla 'servicios' en Supabase.
  // Pedimos todas las columnas con '*'.
  const { data, error } = await supabase
    .from('servicios')
    .select('*')

  // Si hay un problema de conexión o permisos, mostramos el error en pantalla.
  if (error) {
    return (
      <div className="p-10 font-mono border-2 border-red-500 m-5 rounded">
        <h1 className="text-red-500 font-bold text-xl">Error de Conexión:</h1>
        <p className="mt-2 text-gray-700">Asegúrate de que las variables de entorno en Vercel estén correctas.</p>
        <pre className="bg-gray-100 p-4 mt-4 overflow-auto">{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }

  // Forzamos a que 'servicios' sea tratado como una lista de nuestro tipo 'Servicio'.
  const servicios = data as Servicio[];

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      {/* Título dinámico que toma el nombre del local de la primera fila si existe */}
      <h1 className="text-3xl font-bold text-center mb-10 text-blue-600">
        Agéndalo - {servicios?.[0]?.local || 'Servicios Disponibles'}
      </h1>
      
      {/* Contenedor de las tarjetas (Grid) que se adapta a celulares y computadoras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Si hay servicios, los recorremos con .map para crear las tarjetas */}
        {servicios?.length > 0 ? (
          servicios.map((servicio) => (
            <div key={servicio.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition">
              {/* Mostramos el nombre en mayúsculas para que se vea más profesional */}
              <h2 className="text-xl font-semibold text-gray-800 uppercase">{servicio.nombre}</h2>
              
              {/* Formateamos el precio a moneda chilena (CLP) */}
              <p className="text-blue-500 font-bold mt-2 text-2xl">
                ${servicio.precio.toLocaleString('es-CL')}
              </p>
              
              {/* Información adicional del local y categoría */}
              <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                <span className="bg-blue-50 px-2 py-1 rounded text-blue-700 font-medium">
                  {servicio.categoria}
                </span>
                <span className="italic">Sede: {servicio.local}</span>
              </div>
              
              {/* Botón de acción (próximamente abrirá el formulario de reserva) */}
              <button className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                AGENDAR BLOQUE (1H)
              </button>
            </div>
          ))
        ) : (
          /* Mensaje en caso de que la tabla de PostgreSQL esté vacía */
          <p className="text-center col-span-full text-gray-400">No se encontraron servicios cargados.</p>
        )}
      </div>
    </main>
  )
}