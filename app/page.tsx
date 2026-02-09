export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">AGENDALO!</h1>
        <p className="text-gray-600">Bienvenido a tu sistema de reservas local.</p>
        <button className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition">
          Ver Agenda
        </button>
      </div>
    </div>
  )
}