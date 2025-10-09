"use client"

import { useState, useEffect } from "react"
import { Calendar, Users, Scissors, Clock, Plus, X, Check, AlertCircle, Eye, Trash2, RefreshCw } from "lucide-react"

const API_BASE = "http://localhost:8080/api"

export default function BarberiaApp() {
  const [activeView, setActiveView] = useState("dashboard")
  const [barberos, setBarberos] = useState([])
  const [clientes, setClientes] = useState([])
  const [citas, setCitas] = useState([])
  const [notification, setNotification] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const mostrarNotificacion = (mensaje, tipo = "success") => {
    setNotification({ mensaje, tipo })
    setTimeout(() => setNotification(null), 3000)
  }

  // 🔹 Función genérica para validar respuestas
  const manejarRespuesta = async (res, setState, nombre) => {
    if (!res.ok) throw new Error(`Error ${res.status} al obtener ${nombre}: ${res.statusText}`)
    const data = await res.json()
    if (Array.isArray(data)) setState(data)
    else {
      console.error(`⚠️ Respuesta inesperada de /${nombre}:`, data)
      setState([])
    }
  }

  const cargarDatos = async () => {
    setLoading(true)
    await Promise.all([cargarBarberos(), cargarClientes(), cargarCitas()])
    setLoading(false)
  }

  const cargarBarberos = async () => {
    try {
      const res = await fetch(`${API_BASE}/barberos`)
      await manejarRespuesta(res, setBarberos, "barberos")
    } catch (err) {
      console.error("Error al cargar barberos:", err)
      mostrarNotificacion("Error al cargar barberos", "error")
      setBarberos([])
    }
  }

  const cargarClientes = async () => {
    try {
      const res = await fetch(`${API_BASE}/clientes`)
      await manejarRespuesta(res, setClientes, "clientes")
    } catch (err) {
      console.error("Error al cargar clientes:", err)
      mostrarNotificacion("Error al cargar clientes", "error")
      setClientes([])
    }
  }

  const cargarCitas = async () => {
    try {
      const res = await fetch(`${API_BASE}/citas`)
      await manejarRespuesta(res, setCitas, "citas")
    } catch (err) {
      console.error("Error al cargar citas:", err)
      mostrarNotificacion("Error al cargar citas", "error")
      setCitas([])
    }
  }

  return (
      <div className="min-h-screen bg-gray-50">
        {notification && (
            <div
                className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
                    notification.tipo === "success" ? "bg-green-500" : "bg-red-500"
                } text-white animate-pulse`}
            >
              {notification.tipo === "success" ? <Check size={20} /> : <AlertCircle size={20} />}
              {notification.mensaje}
            </div>
        )}

        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Scissors className="text-blue-600" size={32} />
                <h1 className="text-2xl font-bold text-gray-800">BarberiaUQ</h1>
              </div>
              <nav className="flex gap-2 flex-wrap">
                {[
                  ["dashboard", Calendar, "Dashboard"],
                  ["barberos", Scissors, "Barberos"],
                  ["clientes", Users, "Clientes"],
                  ["citas", Clock, "Agendar"],
                  ["ver-citas", Eye, "Ver Citas"],
                ].map(([key, Icon, label]) => (
                    <button
                        key={key}
                        onClick={() => setActiveView(key)}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                            activeView === key ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                      <Icon size={18} />
                      {label}
                    </button>
                ))}
                <button
                    onClick={cargarDatos}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg flex items-center gap-2 transition bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                  Recargar
                </button>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {activeView === "dashboard" && <Dashboard barberos={barberos} citas={citas} clientes={clientes} />}
          {activeView === "barberos" && (
              <GestionBarberos barberos={barberos} onRecargar={cargarBarberos} onNotificar={mostrarNotificacion} />
          )}
          {activeView === "clientes" && (
              <GestionClientes clientes={clientes} onRecargar={cargarClientes} onNotificar={mostrarNotificacion} />
          )}
          {activeView === "citas" && (
              <AgendarCita
                  barberos={barberos}
                  clientes={clientes}
                  onRecargar={cargarCitas}
                  onNotificar={mostrarNotificacion}
              />
          )}
          {activeView === "ver-citas" && (
              <VerCitas
                  citas={citas}
                  barberos={barberos}
                  clientes={clientes}
                  onRecargar={cargarCitas}
                  onNotificar={mostrarNotificacion}
              />
          )}
        </main>
      </div>
  )
}

function Dashboard({ barberos, citas, clientes }) {
  const hoy = new Date().toISOString().split("T")[0]
  const citasHoy = Array.isArray(citas) ? citas.filter((c) => c.fechaHoraInicio?.startsWith(hoy)) : []

  return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <InfoCard
              label="Barberos Activos"
              value={barberos.filter((b) => b.activo).length}
              color="blue"
              Icon={Scissors}
          />
          <InfoCard label="Clientes" value={clientes.length} color="green" Icon={Users} />
          <InfoCard label="Citas Hoy" value={citasHoy.length} color="purple" Icon={Clock} />
          <InfoCard label="Total Citas" value={citas.length} color="orange" Icon={Calendar} />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-xl font-bold mb-4">Barberos Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {barberos
                .filter((b) => b.activo)
                .map((barbero) => (
                    <div key={barbero.id} className="p-4 border rounded-lg hover:shadow-md transition">
                      <h4 className="font-semibold text-lg">{barbero.nombre}</h4>
                      <p className="text-gray-600 text-sm">{barbero.especialidad || "Sin especialidad"}</p>
                      <p className="text-gray-500 text-sm">{barbero.telefono || "Sin teléfono"}</p>
                    </div>
                ))}
          </div>
        </div>
      </div>
  )
}

function InfoCard({ label, value, color, Icon }) {
  const colors = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  }
  return (
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">{label}</p>
            <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
          </div>
          <Icon className={colors[color]} size={40} />
        </div>
      </div>
  )
}

function GestionBarberos({ barberos, onRecargar, onNotificar }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [formData, setFormData] = useState({ nombre: "", especialidad: "", telefono: "" })
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null)
  const [mostrarHorarios, setMostrarHorarios] = useState(false)

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const crearBarbero = async () => {
    if (!formData.nombre) {
      onNotificar("El nombre es requerido", "error")
      return
    }
    try {
      const res = await fetch(`${API_BASE}/barberos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        onNotificar("Barbero creado exitosamente")
        setFormData({ nombre: "", especialidad: "", telefono: "" })
        setMostrarForm(false)
        onRecargar()
      } else {
        onNotificar("Error al crear barbero", "error")
      }
    } catch (err) {
      onNotificar("Error al crear barbero", "error")
    }
  }

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Barberos</h2>
          <button
              onClick={() => setMostrarForm(!mostrarForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
          >
            {mostrarForm ? <X size={18} /> : <Plus size={18} />}
            {mostrarForm ? "Cancelar" : "Nuevo Barbero"}
          </button>
        </div>

        {mostrarForm && (
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-xl font-semibold mb-4">Crear Nuevo Barbero</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange("nombre", e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                  <input
                      type="text"
                      value={formData.especialidad}
                      onChange={(e) => handleInputChange("especialidad", e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange("telefono", e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                    onClick={crearBarbero}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Crear Barbero
                </button>
              </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barberos.map((barbero) => (
              <div key={barbero.id} className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{barbero.nombre}</h3>
                    <p className="text-gray-600">{barbero.especialidad || "Sin especialidad"}</p>
                    <p className="text-gray-500 text-sm">{barbero.telefono || "Sin teléfono"}</p>
                  </div>
                  <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                          barbero.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                  >
                {barbero.activo ? "Activo" : "Inactivo"}
              </span>
                </div>
                <button
                    onClick={() => {
                      setBarberoSeleccionado(barbero)
                      setMostrarHorarios(true)
                    }}
                    className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
                >
                  Gestionar Horarios
                </button>
              </div>
          ))}
        </div>

        {mostrarHorarios && barberoSeleccionado && (
            <GestionHorarios
                barbero={barberoSeleccionado}
                onCerrar={() => {
                  setMostrarHorarios(false)
                  setBarberoSeleccionado(null)
                }}
                onNotificar={onNotificar}
            />
        )}
      </div>
  )
}

function GestionHorarios({ barbero, onCerrar, onNotificar }) {
  const [horario, setHorario] = useState({ diaSemana: 1, horaInicio: "09:00", horaFin: "18:00" })
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  const agregarHorario = async () => {
    try {
      const res = await fetch(`${API_BASE}/barberos/${barbero.id}/horarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(horario),
      })
      if (res.ok) {
        onNotificar("Horario agregado exitosamente")
        setHorario({ diaSemana: 1, horaInicio: "09:00", horaFin: "18:00" })
      } else {
        onNotificar("Error al agregar horario", "error")
      }
    } catch (err) {
      onNotificar("Error al agregar horario", "error")
    }
  }

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Horarios - {barbero.nombre}</h3>
            <button onClick={onCerrar} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Día de la Semana</label>
              <select
                  value={horario.diaSemana}
                  onChange={(e) => setHorario({ ...horario, diaSemana: Number.parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {dias.map((dia, idx) => (
                    <option key={idx} value={idx + 1}>
                      {dia}
                    </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio</label>
              <input
                  type="time"
                  value={horario.horaInicio}
                  onChange={(e) => setHorario({ ...horario, horaInicio: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin</label>
              <input
                  type="time"
                  value={horario.horaFin}
                  onChange={(e) => setHorario({ ...horario, horaFin: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
                onClick={agregarHorario}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Agregar Horario
            </button>
          </div>
        </div>
      </div>
  )
}

function GestionClientes({ clientes, onRecargar, onNotificar }) {
  const [formData, setFormData] = useState({ nombre: "", documento: "", telefono: "" })
  const [mostrarLista, setMostrarLista] = useState(false)

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const crearCliente = async () => {
    if (!formData.nombre || !formData.documento || !formData.telefono) {
      onNotificar("Todos los campos son requeridos", "error")
      return
    }
    try {
      const res = await fetch(`${API_BASE}/clientes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        onNotificar("Cliente registrado exitosamente")
        setFormData({ nombre: "", documento: "", telefono: "" })
        onRecargar()
      } else {
        const errorText = await res.text()
        console.error("Error del servidor:", errorText)
        onNotificar("Error: documento o teléfono ya registrado", "error")
      }
    } catch (err) {
      console.error("Error al registrar cliente:", err)
      onNotificar("Error al registrar cliente", "error")
    }
  }

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">Registro de Clientes</h2>
          <button
              onClick={() => setMostrarLista(!mostrarLista)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition"
          >
            <Users size={18} />
            {mostrarLista ? "Ocultar Lista" : "Ver Clientes"}
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border max-w-2xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange("nombre", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
              <input
                  type="text"
                  value={formData.documento}
                  onChange={(e) => handleInputChange("documento", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange("telefono", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
                onClick={crearCliente}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Registrar Cliente
            </button>
          </div>
        </div>

        {mostrarLista && (
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-xl font-bold mb-4">Lista de Clientes</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">ID</th>
                    <th className="text-left py-2 px-4">Nombre</th>
                    <th className="text-left py-2 px-4">Documento</th>
                    <th className="text-left py-2 px-4">Teléfono</th>
                  </tr>
                  </thead>
                  <tbody>
                  {clientes.map((cliente) => (
                      <tr key={cliente.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{cliente.id}</td>
                        <td className="py-2 px-4">{cliente.nombre}</td>
                        <td className="py-2 px-4">{cliente.documento}</td>
                        <td className="py-2 px-4">{cliente.telefono}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
        )}
      </div>
  )
}

function AgendarCita({ barberos, clientes, onRecargar, onNotificar }) {
  const [formData, setFormData] = useState({
    clienteId: "",
    barberoId: "",
    fecha: "",
    horaInicio: "",
    horaFin: "",
  })

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const agendarCita = async () => {
    if (!formData.clienteId || !formData.barberoId || !formData.fecha || !formData.horaInicio || !formData.horaFin) {
      onNotificar("Todos los campos son requeridos", "error")
      return
    }
    try {
      const fechaHoraInicio = `${formData.fecha}T${formData.horaInicio}:00`
      const fechaHoraFin = `${formData.fecha}T${formData.horaFin}:00`

      const res = await fetch(`${API_BASE}/citas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: Number.parseInt(formData.clienteId),
          barberoId: Number.parseInt(formData.barberoId),
          fechaHoraInicio,
          fechaHoraFin,
        }),
      })

      if (res.ok) {
        onNotificar("Cita agendada exitosamente")
        setFormData({ clienteId: "", barberoId: "", fecha: "", horaInicio: "", horaFin: "" })
        onRecargar()
      } else {
        onNotificar("Error al agendar cita", "error")
      }
    } catch (err) {
      onNotificar("Error al agendar cita", "error")
    }
  }

  return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800">Agendar Cita</h2>
        <div className="bg-white p-6 rounded-xl shadow-sm border max-w-2xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select
                  value={formData.clienteId}
                  onChange={(e) => handleInputChange("clienteId", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione un cliente</option>
                {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} - {cliente.documento}
                    </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barbero</label>
              <select
                  value={formData.barberoId}
                  onChange={(e) => handleInputChange("barberoId", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione un barbero</option>
                {barberos
                    .filter((b) => b.activo)
                    .map((barbero) => (
                        <option key={barbero.id} value={barbero.id}>
                          {barbero.nombre} - {barbero.especialidad || "General"}
                        </option>
                    ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => handleInputChange("fecha", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio</label>
                <input
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => handleInputChange("horaInicio", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin</label>
                <input
                    type="time"
                    value={formData.horaFin}
                    onChange={(e) => handleInputChange("horaFin", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
                onClick={agendarCita}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Agendar Cita
            </button>
          </div>
        </div>
      </div>
  )
}

function VerCitas({ citas, barberos, clientes, onRecargar, onNotificar }) {
  const obtenerNombreCliente = (cita) => cita.cliente?.nombre || "Desconocido"
  const obtenerNombreBarbero = (cita) => cita.barbero?.nombre || "Desconocido"

  const eliminarCita = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar esta cita?")) return

    try {
      const res = await fetch(`${API_BASE}/citas/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        onNotificar("Cita eliminada exitosamente")
        onRecargar()
      } else {
        onNotificar("Error al eliminar cita", "error")
      }
    } catch (err) {
      onNotificar("Error al eliminar cita", "error")
    }
  }

  const citasOrdenadas = [...citas].sort((a, b) => new Date(b.fechaHoraInicio) - new Date(a.fechaHoraInicio))

  return (<div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800">Citas Agendadas</h2>
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {citasOrdenadas.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No hay citas agendadas</p>
              </div>
          ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">ID</th>
                    <th className="text-left py-3 px-4 font-semibold">Cliente</th>
                    <th className="text-left py-3 px-4 font-semibold">Barbero</th>
                    <th className="text-left py-3 px-4 font-semibold">Fecha</th>
                    <th className="text-left py-3 px-4 font-semibold">Hora Inicio</th>
                    <th className="text-left py-3 px-4 font-semibold">Hora Fin</th>
                    <th className="text-left py-3 px-4 font-semibold">Acciones</th>
                  </tr>
                  </thead>
                  <tbody>
                  {citasOrdenadas.map((cita) => {
                    const fechaInicio = new Date(cita.fechaHoraInicio)
                    const fechaFin = new Date(cita.fechaHoraFin)
                    const horaInicio = fechaInicio.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
                    const horaFin = fechaFin.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
                    const fechaStr = fechaInicio.toLocaleDateString("es-CO")

                    return (
                        <tr key={cita.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{cita.id}</td>
                          <td className="py-3 px-4">{obtenerNombreCliente(cita)}</td>
                          <td className="py-3 px-4">{obtenerNombreBarbero(cita)}</td>
                          <td className="py-3 px-4">{fechaStr}</td>
                          <td className="py-3 px-4">{horaInicio}</td>
                          <td className="py-3 px-4">{horaFin}</td>
                          <td className="py-3 px-4">
                            <button
                                onClick={() => eliminarCita(cita.id)}
                                className="text-red-600 hover:text-red-800 transition p-1 rounded hover:bg-red-50"
                                title="Eliminar cita"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                    )
                  })}
                  </tbody>
                </table>
              </div>
          )}
        </div>
      </div>
  )
}