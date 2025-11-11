"use client"

import { useState, useEffect } from "react"
import { Calendar, Users, Scissors, Clock, Plus, X, Check, AlertCircle, Eye, Trash2, RefreshCw, Pencil, Save } from "lucide-react"

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080/api"


const leerMensajeServidor = async (res) => {
    try {
        const text = await res.text();
        try {
            const json = JSON.parse(text);
            return json.message || json.mensaje || json.error || text || `HTTP ${res.status}`;
        } catch {
            return text || `HTTP ${res.status}`;
        }
    } catch {
        return `HTTP ${res.status}`;
    }
};

export default function BarberiaApp() {
    const [activeView, setActiveView] = useState("dashboard")
    const [barberos, setBarberos] = useState([])
    const [clientes, setClientes] = useState([])
    const [citas, setCitas] = useState([])
    const [notification, setNotification] = useState(null)
    const [servicios, setServicios] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        cargarDatos()
    }, [])

    const mostrarNotificacion = (mensaje, tipo = "success") => {
        setNotification({ mensaje, tipo })
        setTimeout(() => setNotification(null), 3000)
    }

    const manejarRespuesta = async (res, setState, nombre) => {
        if (!res.ok) throw new Error(`Error ${res.status} al obtener ${nombre}: ${res.statusText}`)
        const data = await res.json()
        if (Array.isArray(data)) setState(data)
        else {
            console.error(`⚠️ Respuesta inesperada de /${nombre}:`, data)
            setState([])
        }
    }

    const cargarServicios = async () => {
        try {
            const res = await fetch(`${API_BASE}/servicios`);
            await manejarRespuesta(res, setServicios, "servicios");
        } catch (err) {
            console.error("Error al cargar servicios:", err);
            mostrarNotificacion("Error al cargar servicios", "error");
            setServicios([]);
        }
    };

    const cargarDatos = async () => {
        setLoading(true)
        await Promise.all([cargarBarberos(), cargarClientes(), cargarCitas(), cargarServicios()])
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
                                ["agenda", Calendar, "Agenda"], // 🔥 Nueva vista
                                ["ver-citas", Eye, "Ver Citas"],
                                ["servicios", Scissors, "Servicios"]
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
                        servicios={servicios}
                        onRecargar={cargarCitas}
                        onNotificar={mostrarNotificacion}
                    />
                )}
                {activeView === "agenda" && (
                    <AgendaView
                        barberos={barberos}
                        clientes={clientes}
                        servicios={servicios}
                        onNotificar={mostrarNotificacion}
                        onCitaCreada={() => { cargarCitas(); setActiveView("ver-citas"); }}
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
                {activeView === "servicios" && (
                    <GestionServicios
                        servicios={servicios}
                        onRecargar={cargarServicios}
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
                const msg = await leerMensajeServidor(res);
                onNotificar(`Error al crear barbero: ${msg}`, "error")
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
                        <div className="flex gap-2">
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
    const [horario, setHorario] = useState({ diaSemana: 1, horaInicio: "09:00", horaFin: "18:00" });
    const [filas, setFilas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mostrarSemana, setMostrarSemana] = useState(false); // 🔥 nuevo

    const addFila = () => setFilas(prev => [...prev, { diaSemana: 1, horaInicio: "09:00", horaFin: "18:00" }]);
    const removeFila = (i) => setFilas(prev => prev.filter((_, idx) => idx !== i));
    const updateFila = (i, field, val) => setFilas(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

    const agregarHorario = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/barberos/${barbero.id}/horarios`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    diaSemana: Number(horario.diaSemana),
                    horaInicio: horario.horaInicio,
                    horaFin: horario.horaFin
                }),
            });
            if (!res.ok) throw new Error(await leerMensajeServidor(res));
            onNotificar("Franja agregada exitosamente");
            setHorario({ diaSemana: 1, horaInicio: "09:00", horaFin: "18:00" });
        } catch (err) {
            onNotificar(`Error al agregar horario: ${err.message || err}`, "error");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const guardarDisponibilidad = async () => {
        if (filas.length === 0) { onNotificar("Añade al menos una fila", "error"); return; }
        try {
            setLoading(true);
            const payload = {
                idBarbero: Number(barbero.id),
                horariosDisponibles: filas.map(h => ({
                    diaSemana: Number(h.diaSemana),
                    horaInicio: h.horaInicio,
                    horaFin: h.horaFin
                }))
            };
            const res = await fetch(`${API_BASE}/barberos/disponibilidad`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(await leerMensajeServidor(res));
            onNotificar("Disponibilidad actualizada");
            setFilas([]);
        } catch (err) {
            onNotificar(`Error al actualizar disponibilidad: ${err.message || err}`, "error");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const verAgendaHoy = async () => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth()+1).padStart(2,"0");
        const d = String(today.getDate()).padStart(2,"0");
        const diaISO = `${y}-${m}-${d}`;
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/barberos/${barbero.id}/agenda?dia=${diaISO}`);
            if (!res.ok) throw new Error(await leerMensajeServidor(res));
            const citas = await res.json();
            if (!Array.isArray(citas) || citas.length === 0) {
                onNotificar("Sin citas para hoy");
                return;
            }
            const listado = citas.map(c => `• ${c.fechaHoraInicio} → ${c.fechaHoraFin}`).join("\n");
            alert(`Agenda de hoy (${barbero.nombre}):\n${listado}`);
        } catch (err) {
            onNotificar(`No se pudo consultar la agenda: ${err.message || err}`, "error");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-3xl w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Horarios - {barbero.nombre}</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={()=>setMostrarSemana(true)} className="text-sm px-3 py-1 border rounded">
                            Ver semana
                        </button>
                        <button onClick={verAgendaHoy} disabled={loading} className="text-sm px-3 py-1 border rounded">
                            Ver agenda hoy
                        </button>
                        <button onClick={onCerrar} className="text-gray-500 hover:text-gray-700">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Agregar franja puntual */}
                <div className="space-y-4 mb-6">
                    <h4 className="font-semibold">Agregar franja puntual</h4>
                    <div className="grid grid-cols-12 gap-3">
                        <select
                            className="col-span-4 border rounded px-3 py-2"
                            value={horario.diaSemana}
                            onChange={(e) => setHorario({ ...horario, diaSemana: Number(e.target.value) })}
                        >
                            {["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].map((dia, idx) => (
                                <option key={idx} value={idx + 1}>{dia}</option>
                            ))}
                        </select>
                        <input
                            type="time"
                            step="900"
                            className="col-span-4 border rounded px-3 py-2"
                            value={horario.horaInicio}
                            onChange={(e) => setHorario({ ...horario, horaInicio: e.target.value })}
                        />
                        <input
                            type="time"
                            step="900"
                            className="col-span-4 border rounded px-3 py-2"
                            value={horario.horaFin}
                            onChange={(e) => setHorario({ ...horario, horaFin: e.target.value })}
                        />
                    </div>
                    <button
                        onClick={agregarHorario}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Agregar franja
                    </button>
                </div>

                {/* Actualización masiva */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Actualizar disponibilidad completa</h4>
                        <button onClick={addFila} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">Añadir fila</button>
                    </div>

                    {filas.length === 0 && (
                        <p className="text-sm text-gray-500">No hay filas. Usa “Añadir fila”.</p>
                    )}

                    {filas.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2">
                            <select
                                className="col-span-3 border rounded px-2 py-2"
                                value={row.diaSemana}
                                onChange={(e)=>updateFila(idx, "diaSemana", Number(e.target.value))}
                            >
                                {["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].map((d, i) => <option key={i} value={i+1}>{d}</option>)}
                            </select>
                            <input
                                type="time"
                                step="900"
                                className="col-span-3 border rounded px-2 py-2"
                                value={row.horaInicio}
                                onChange={(e)=>updateFila(idx, "horaInicio", e.target.value)}
                            />
                            <input
                                type="time"
                                step="900"
                                className="col-span-3 border rounded px-2 py-2"
                                value={row.horaFin}
                                onChange={(e)=>updateFila(idx, "horaFin", e.target.value)}
                            />
                            <button
                                className="col-span-3 px-3 py-2 border rounded text-red-600"
                                onClick={()=>removeFila(idx)}
                            >
                                Eliminar
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={guardarDisponibilidad}
                        disabled={loading || filas.length === 0}
                        className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition mt-2"
                    >
                        Guardar disponibilidad completa
                    </button>
                </div>
            </div>

            {/* Modal agenda semanal desde horarios */}
            {mostrarSemana && (
                <AgendaSemanal
                    barbero={barbero}
                    onCerrar={()=>setMostrarSemana(false)}
                />
            )}
        </div>
    );
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
                const errorText = await leerMensajeServidor(res)
                console.error("Error del servidor:", errorText)
                onNotificar(`Error al registrar cliente: ${errorText}`, "error")
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
// --- util para sumar minutos a un "HH:MM" ---
function addMinutesToHHMM(hhmm, minutes) {
    if (!hhmm) return hhmm;
    const [h, m] = hhmm.split(":").map(Number);
    const date = new Date(0, 0, 0, h, m || 0, 0);
    date.setMinutes(date.getMinutes() + minutes);
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
}

function AgendarCita({ barberos, clientes, servicios, onRecargar, onNotificar }) {
    const [formData, setFormData] = useState({
        clienteId: "",
        barberoId: "",
        servicioId: "",
        fecha: "",
        horaInicio: "",
        horaFin: "",
    })

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value })
    }

    const agendarCita = async () => {
        if (!formData.clienteId || !formData.barberoId || !formData.servicioId || !formData.fecha || !formData.horaInicio || !formData.horaFin) {
            onNotificar("Todos los campos son requeridos", "error");
            return;
        }

        const fecha = formData.fecha;
        const hi = formData.horaInicio;
        const hf = formData.horaFin;
        const fechaHoraInicio = `${fecha}T${hi}:00`;
        const fechaHoraFin    = `${fecha}T${hf}:00`;

        const tIni = new Date(fechaHoraInicio);
        const tFin = new Date(fechaHoraFin);
        if (!(tIni instanceof Date) || isNaN(tIni.getTime()) || !(tFin instanceof Date) || isNaN(tFin.getTime())) {
            onNotificar("Formato de fecha/hora inválido", "error");
            return;
        }
        if (tFin <= tIni) {
            onNotificar("La hora fin debe ser mayor que la hora inicio", "error");
            return;
        }

        const mins = (tFin - tIni) / 60000;
        if (mins < 60) {
            onNotificar("La cita debe durar al menos 60 minutos", "error");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/citas`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({
                    clienteId: Number(formData.clienteId),
                    barberoId: Number(formData.barberoId),
                    servicioId: Number(formData.servicioId),
                    fechaHoraInicio,
                    fechaHoraFin
                }),
            });

            if (!res.ok) {
                if (res.status === 409) {
                    onNotificar("Ese horario ya está ocupado", "error");
                } else if (res.status === 422) {
                    onNotificar("Datos inválidos para la cita", "error");
                } else if (res.status === 404) {
                    onNotificar("Cliente/Barbero/Servicio no encontrado", "error");
                } else {
                    const msg = await leerMensajeServidor(res);
                    onNotificar(`Error al agendar cita: ${msg}`, "error");
                }
                console.error("POST /citas error:", res.status);
                return;
            }

            onNotificar("Cita agendada exitosamente");
            setFormData({ clienteId: "", barberoId: "", servicioId: "", fecha: "", horaInicio: "", horaFin: "" });
            onRecargar();
        } catch (err) {
            console.error("POST /citas exception:", err);
            onNotificar("Error al agendar cita", "error");
        }
    };

    const serviciosActivos = Array.isArray(servicios) ? servicios.filter(s => s.activo) : [];
    const servicioSeleccionado = serviciosActivos.find(s => String(s.id) === String(formData.servicioId));

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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
                        <select
                            value={formData.servicioId}
                            onChange={(e) => handleInputChange("servicioId", e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Seleccione un servicio</option>
                            {serviciosActivos.map(s => (
                                <option key={s.id} value={s.id}>{s.nombre} — ${Number(s.precio).toLocaleString("es-CO")}</option>
                            ))}
                        </select>
                        {servicioSeleccionado && (
                            <p className="text-sm text-gray-600 mt-1">
                                Precio: <strong>$ {Number(servicioSeleccionado.precio).toLocaleString("es-CO")}</strong>
                            </p>
                        )}
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
                                step="3600"
                                value={formData.horaInicio}
                                onChange={(e) => {
                                    const hi = e.target.value;
                                    const hf = addMinutesToHHMM(hi, 60); // +60 minutos
                                    setFormData(f => ({ ...f, horaInicio: hi, horaFin: hf }));
                                }}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin</label>
                            <input
                                type="time"
                                step="3600"
                                value={formData.horaFin}
                                readOnly
                                className="w-full px-4 py-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
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

/* =========================
 * Vista Agenda (semanal) con selector de barbero y agendamiento por click
 * ========================= */
function AgendaView({ barberos, clientes, servicios, onNotificar, onCitaCreada }) {
    const activos = Array.isArray(barberos) ? barberos.filter(b => b.activo) : [];
    const [barberoId, setBarberoId] = useState(activos[0]?.id ?? "");
    const barbero = activos.find(b => String(b.id) === String(barberoId));

    // Modal para crear cita rápido desde un slot
    const [modal, setModal] = useState(null); // { dayISO, startMin, endMin }
    const [clienteId, setClienteId] = useState("");
    const [servicioId, setServicioId] = useState("");

    useEffect(()=> {
        if (!barberoId && activos.length>0) setBarberoId(activos[0].id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activos.length]);

    const cerrarModal = () => {
        setModal(null);
        setClienteId("");
        setServicioId("");
    };

    const confirmarAgendamiento = async () => {
        if (!modal || !barbero) return;
        if (!clienteId || !servicioId) {
            onNotificar("Selecciona cliente y servicio", "error");
            return;
        }
        const hi = minutesToHHMM(modal.startMin);
        const hf = minutesToHHMM(modal.endMin);
        const fechaHoraInicio = `${modal.dayISO}T${hi}:00`;
        const fechaHoraFin    = `${modal.dayISO}T${hf}:00`;

        try {
            const res = await fetch(`${API_BASE}/citas`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({
                    clienteId: Number(clienteId),
                    barberoId: Number(barbero.id),
                    servicioId: Number(servicioId),
                    fechaHoraInicio,
                    fechaHoraFin
                }),
            });
            if (!res.ok) {
                const msg = await leerMensajeServidor(res);
                onNotificar(`No se pudo agendar: ${msg}`, "error");
                return;
            }
            onNotificar("Cita creada desde la agenda");
            cerrarModal();
            onCitaCreada?.();
        } catch (e) {
            console.error(e);
            onNotificar("Error al crear cita", "error");
        }
    };

    const serviciosActivos = Array.isArray(servicios) ? servicios.filter(s => s.activo) : [];

    return (
        <div className="space-y-4">
            <div className="flex items-end gap-3 flex-wrap">
                <div>
                    <label className="block text-sm text-gray-700 mb-1">Barbero</label>
                    <select
                        value={barberoId}
                        onChange={(e)=>setBarberoId(e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 min-w-60"
                    >
                        {activos.map(b => (
                            <option key={b.id} value={b.id}>{b.nombre} — {b.especialidad || "General"}</option>
                        ))}
                    </select>
                </div>
                <div className="text-sm text-gray-500">
                    Haz click en un bloque <span className="inline-block align-middle w-3 h-3 bg-green-500/80 rounded mx-1"></span> para agendar.
                </div>
            </div>

            {!barbero ? (
                <div className="p-6 bg-white rounded-xl border text-gray-600">No hay barberos activos.</div>
            ) : (
                <div className="relative">
                    <AgendaSemanal
                        barbero={barbero}
                        onSlotClick={(info)=> setModal(info)} // {dayISO, startMin, endMin}
                    />
                </div>
            )}

            {/* Modal de creación rápida */}
            {modal && (
                <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-[95vw] max-w-lg">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold">Nueva cita</h3>
                            <button onClick={cerrarModal} className="text-gray-500 hover:text-gray-700">
                                <X size={22} />
                            </button>
                        </div>
                        <div className="space-y-3 text-sm">
                            <p className="text-gray-600">
                                <strong>Barbero:</strong> {barbero?.nombre} <br />
                                <strong>Fecha:</strong> {formatDate(new Date(modal.dayISO))} <br />
                                <strong>Hora:</strong> {minutesToHHMM(modal.startMin)} – {minutesToHHMM(modal.endMin)}
                            </p>
                            <div>
                                <label className="block mb-1 text-gray-700">Cliente</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={clienteId}
                                    onChange={(e)=>setClienteId(e.target.value)}
                                >
                                    <option value="">Seleccione…</option>
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre} — {c.documento}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-1 text-gray-700">Servicio</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={servicioId}
                                    onChange={(e)=>setServicioId(e.target.value)}
                                >
                                    <option value="">Seleccione…</option>
                                    {serviciosActivos.map(s => (
                                        <option key={s.id} value={s.id}>{s.nombre} — ${Number(s.precio).toLocaleString("es-CO")}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button onClick={cerrarModal} className="px-4 py-2 border rounded-lg">Cancelar</button>
                            <button onClick={confirmarAgendamiento} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* =========================
 * Ver Citas con chip DEBE/PAGO y toggle de pago
 * ========================= */
function VerCitas({ citas, barberos, clientes, onRecargar, onNotificar }) {
    const [cargandoPagoId, setCargandoPagoId] = useState(null);

    const obtenerNombreCliente = (cita) => cita.cliente?.nombre || "Desconocido";
    const obtenerNombreBarbero = (cita) => cita.barbero?.nombre || "Desconocido";

    const eliminarCita = async (id) => {
        if (!window.confirm("¿Está seguro de eliminar esta cita?")) return;

        try {
            const res = await fetch(`${API_BASE}/citas/${id}`, { method: "DELETE" });
            if (res.ok) {
                onNotificar("Cita eliminada exitosamente");
                onRecargar();
            } else {
                const msg = await leerMensajeServidor(res);
                onNotificar(`Error al eliminar cita: ${msg}`, "error");
            }
        } catch (err) {
            onNotificar("Error al eliminar cita", "error");
        }
    };

    const togglePagado = async (cita) => {
        const fechaFin = new Date(cita.fechaHoraFin);
        const yaPaso = fechaFin.getTime() < Date.now();
        if (!yaPaso) return; // seguridad extra

        const nuevoEstado = !Boolean(cita.pagado);

        if (nuevoEstado === true) {
            const ok = window.confirm("¿Confirmar que esta cita fue pagada?");
            if (!ok) return;
        }
        try {
            setCargandoPagoId(cita.id);
            const res = await fetch(`${API_BASE}/citas/${cita.id}/pagado?pagado=${nuevoEstado}`, {
                method: "PUT",
            });
            if (!res.ok) {
                const msg = await leerMensajeServidor(res);
                onNotificar(`No se pudo actualizar el pago: ${msg}`, "error");
                return;
            }
            onNotificar(nuevoEstado ? "Cita marcada como PAGO" : "Cita marcada como DEBE");
            onRecargar();
        } catch (e) {
            console.error(e);
            onNotificar("Error al actualizar estado de pago", "error");
        } finally {
            setCargandoPagoId(null);
        }
    };

    const citasOrdenadas = [...citas].sort(
        (a, b) => new Date(b?.fechaHoraInicio).getTime() - new Date(a?.fechaHoraInicio).getTime()
    );

    return (
        <div className="space-y-6">
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
                                <th className="text-left py-3 px-4 font-semibold">Servicio</th>
                                <th className="text-left py-3 px-4 font-semibold">Fecha</th>
                                <th className="text-left py-3 px-4 font-semibold">Hora Inicio</th>
                                <th className="text-left py-3 px-4 font-semibold">Hora Fin</th>
                                <th className="text-left py-3 px-4 font-semibold">Pago</th>
                                <th className="text-left py-3 px-4 font-semibold">Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {citasOrdenadas.map((cita) => {
                                const fechaInicio = new Date(cita.fechaHoraInicio);
                                const fechaFin = new Date(cita.fechaHoraFin);
                                const fechaStr = fechaInicio.toLocaleDateString("es-CO");
                                const horaInicio = fechaInicio.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
                                const horaFin = fechaFin.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

                                const yaPaso = fechaFin.getTime() < Date.now();
                                const pagado = Boolean(cita.pagado);

                                let chipTexto = "Pendiente";
                                let chipClases = "bg-gray-100 text-gray-700";
                                if (yaPaso && pagado) {
                                    chipTexto = "PAGO";
                                    chipClases = "bg-green-100 text-green-700";
                                } else if (yaPaso && !pagado) {
                                    chipTexto = "DEBE";
                                    chipClases = "bg-red-100 text-red-700";
                                }

                                return (
                                    <tr key={cita.id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4">{cita.id}</td>
                                        <td className="py-3 px-4">{obtenerNombreCliente(cita)}</td>
                                        <td className="py-3 px-4">{obtenerNombreBarbero(cita)}</td>
                                        <td className="py-3 px-4">{cita.servicio?.nombre ?? "—"}</td>
                                        <td className="py-3 px-4">{fechaStr}</td>
                                        <td className="py-3 px-4">{horaInicio}</td>
                                        <td className="py-3 px-4">{horaFin}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold inline-flex items-center gap-1 ${chipClases}`}>
                                                {chipTexto}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => togglePagado(cita)}
                                                    disabled={!yaPaso || cargandoPagoId === cita.id || Boolean(cita.pagado)}
                                                    className={`p-1 rounded ${
                                                        yaPaso
                                                            ? pagado
                                                                ? "text-amber-700 hover:text-amber-900 hover:bg-amber-50"
                                                                : "text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50"
                                                            : "text-gray-400 cursor-not-allowed"
                                                    }`}
                                                    title={
                                                        !yaPaso
                                                            ? "Disponible cuando la cita haya terminado"
                                                            : pagado
                                                                ? "Cita pagada (bloqueada)"
                                                                : "Marcar como PAGO"
                                                    }
                                                >
                                                    {pagado ? <Check size={18} /> : <Check size={18} />}
                                                </button>

                                                <button
                                                    onClick={() => eliminarCita(cita.id)}
                                                    className="text-red-600 hover:text-red-800 transition p-1 rounded hover:bg-red-50"
                                                    title="Eliminar cita"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
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

/** =========================
 *  BAR-20/21: Gestión de Servicios (crear, editar inline, desactivar)
 *  ========================= */
function GestionServicios({ servicios, onRecargar, onNotificar }) {
    const [form, setForm] = useState({ nombre: "", precio: "" });
    const [enviando, setEnviando] = useState(false);

    const [editId, setEditId] = useState(null);
    const [editForm, setEditForm] = useState({ nombre: "", precio: "" });
    const [guardandoEdicion, setGuardandoEdicion] = useState(false);

    const [borrandoId, setBorrandoId] = useState(null);
    const [mostrarInactivos, setMostrarInactivos] = useState(true);

    const [busqueda, setBusqueda] = useState("");

    const crearServicio = async () => {
        if (!form.nombre?.trim()) {
            onNotificar("El nombre del servicio es requerido", "error");
            return;
        }
        const precioNumber = Number(form.precio);
        if (Number.isNaN(precioNumber) || precioNumber < 0) {
            onNotificar("Precio inválido", "error");
            return;
        }

        try {
            setEnviando(true);
            const res = await fetch(`${API_BASE}/servicios`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre: form.nombre.trim(), precio: precioNumber })
            });
            if (!res.ok) throw new Error(await leerMensajeServidor(res));
            onNotificar("Servicio creado correctamente");
            setForm({ nombre: "", precio: "" });
            onRecargar();
        } catch (e) {
            console.error(e);
            onNotificar(`No se pudo registrar el servicio: ${e.message || e}`, "error");
        } finally {
            setEnviando(false);
        }
    };

    const iniciarEdicion = (s) => {
        setEditId(s.id);
        setEditForm({
            nombre: s.nombre ?? "",
            precio: s.precio ?? ""
        });
    };

    const cancelarEdicion = () => {
        setEditId(null);
        setEditForm({ nombre: "", precio: "" });
    };

    const guardarEdicion = async () => {
        if (!editId) return;

        const nombreTrim = editForm.nombre?.trim();
        const tieneNombre = !!nombreTrim;

        const precioNumber = Number(editForm.precio);
        const tienePrecio = !Number.isNaN(precioNumber) && precioNumber >= 0;

        if (!tieneNombre && !tienePrecio) {
            onNotificar("No hay cambios para guardar", "error");
            return;
        }
        if (tienePrecio && (Number.isNaN(precioNumber) || precioNumber < 0)) {
            onNotificar("Precio inválido", "error");
            return;
        }

        const payload = { id: editId };
        if (tieneNombre) payload.nombre = nombreTrim;
        if (tienePrecio) payload.precio = precioNumber;

        try {
            setGuardandoEdicion(true);
            const res = await fetch(`${API_BASE}/servicios`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(await leerMensajeServidor(res));
            onNotificar("Servicio actualizado");
            cancelarEdicion();
            onRecargar();
        } catch (e) {
            console.error(e);
            onNotificar(`No se pudo actualizar el servicio: ${e.message || e}`, "error");
        } finally {
            setGuardandoEdicion(false);
        }
    };

    const desactivarServicio = async (id) => {
        if (!window.confirm("¿Desactivar este servicio?")) return;
        try {
            setBorrandoId(id);
            const res = await fetch(`${API_BASE}/servicios/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(await leerMensajeServidor(res));
            onNotificar("Servicio desactivado");
            if (editId === id) cancelarEdicion();
            onRecargar();
        } catch (e) {
            console.error(e);
            onNotificar(`No se pudo desactivar el servicio: ${e.message || e}`, "error");
        } finally {
            setBorrandoId(null);
        }
    };

    const reactivarServicio = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/servicios/${id}/activar`, { method: "PATCH" });
            if (!res.ok) throw new Error(await leerMensajeServidor(res));
            onNotificar("Servicio reactivado");
            onRecargar();
        } catch (e) {
            console.error(e);
            onNotificar(`No se pudo reactivar el servicio: ${e.message || e}`, "error");
        }
    };

    const toggleServicio = async (s) => {
        if (s.activo) {
            await desactivarServicio(s.id);
        } else {
            await reactivarServicio(s.id);
        }
    };

    const listaBase = Array.isArray(servicios)
        ? servicios.filter(s => (mostrarInactivos ? true : s.activo))
        : [];

    const normalizar = (t) => String(t ?? "").toLowerCase();
    const lista = listaBase.filter((s) => {
        const q = normalizar(busqueda);
        if (!q) return true;
        const n = normalizar(s.nombre);
        const precioRaw = Number(s.precio);
        const precioTxt = isNaN(precioRaw) ? "" : String(precioRaw);
        return n.includes(q) || precioTxt.includes(q);
    });

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Servicios</h2>

            <div className="bg-white p-6 rounded-xl shadow-sm border max-w-2xl">
                <h3 className="text-xl font-semibold mb-4">Registrar servicio</h3>
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-7">
                        <label className="block text-sm text-gray-700 mb-1">Nombre</label>
                        <input
                            type="text"
                            value={form.nombre}
                            onChange={(e)=>setForm(f=>({...f, nombre:e.target.value}))}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Corte clásico"
                        />
                    </div>
                    <div className="col-span-5">
                        <label className="block text-sm text-gray-700 mb-1">Precio</label>
                        <input
                            type="number"
                            min="0"
                            step="1000"
                            value={form.precio}
                            onChange={(e)=>setForm(f=>({...f, precio:e.target.value}))}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="15000"
                        />
                    </div>
                    <div className="col-span-12">
                        <button
                            onClick={crearServicio}
                            disabled={enviando}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                            {enviando ? "Registrando..." : "Registrar servicio"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 inline-flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={mostrarInactivos}
                            onChange={(e)=>setMostrarInactivos(e.target.checked)}
                        />
                        Mostrar inactivos
                    </label>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e)=>setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre o precio…"
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full md:w-72"
                    />
                    <button
                        onClick={onRecargar}
                        className="px-3 py-2 border rounded text-gray-700 hover:bg-gray-50"
                        title="Recargar"
                    >
                        Recargar
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left py-3 px-4 font-semibold">ID</th>
                            <th className="text-left py-3 px-4 font-semibold">Nombre</th>
                            <th className="text-left py-3 px-4 font-semibold">Precio</th>
                            <th className="text-left py-3 px-4 font-semibold">Activo</th>
                            <th className="text-left py-3 px-4 font-semibold">Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {lista.length > 0 ? (
                            lista.map(s => {
                                const enEdicion = editId === s.id;
                                return (
                                    <tr key={s.id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4">{s.id}</td>

                                        <td className="py-3 px-4">
                                            {enEdicion ? (
                                                <input
                                                    type="text"
                                                    value={editForm.nombre}
                                                    onChange={(e)=>setEditForm(f=>({...f, nombre:e.target.value}))}
                                                    className="px-3 py-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
                                                />
                                            ) : s.nombre}
                                        </td>

                                        <td className="py-3 px-4">
                                            {enEdicion ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1000"
                                                    value={editForm.precio}
                                                    onChange={(e)=>setEditForm(f=>({...f, precio:e.target.value}))}
                                                    className="px-3 py-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
                                                />
                                            ) : (
                                                `$ ${Number(s.precio).toLocaleString("es-CO")}`
                                            )}
                                        </td>

                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-xs ${s.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                                                {s.activo ? "Sí" : "No"}
                                            </span>
                                        </td>

                                        <td className="py-3 px-4">
                                            {enEdicion ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={guardarEdicion}
                                                        disabled={guardandoEdicion}
                                                        className="text-emerald-700 hover:text-emerald-900 p-1 rounded hover:bg-emerald-50"
                                                        title="Guardar"
                                                    >
                                                        <Save size={18} />
                                                    </button>
                                                    <button
                                                        onClick={cancelarEdicion}
                                                        className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-100"
                                                        title="Cancelar"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={()=>iniciarEdicion(s)}
                                                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                                        title="Editar"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>

                                                    <button
                                                        onClick={()=>toggleServicio(s)}
                                                        disabled={borrandoId === s.id}
                                                        className={`p-1 rounded ${s.activo ? "text-red-600 hover:text-red-800 hover:bg-red-50" : "text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50"}`}
                                                        title={s.activo ? "Desactivar" : "Reactivar"}
                                                    >
                                                        {s.activo ? <Trash2 size={18} /> : <Check size={18} />}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr><td className="py-6 px-4 text-gray-500" colSpan={5}>No hay servicios</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
 * Componente de Agenda Semanal reutilizable
 * - Pinta rojo si hay cita, verde si libre (9–18h por defecto)
 * - Navegación de semanas interna
 * - onSlotClick para agendar desde bloque verde (opcional)
 * ============================================================ */
function AgendaSemanal({ barbero, onCerrar, onSlotClick }) {
    // === Configuración de la grilla (bloques de 1 hora) ===
    const SLOT_MINUTES = 60;
    const JORNADA_INICIO = "09:00";
    const JORNADA_FIN    = "18:00";

    // --- Helpers locales (evitan dependencias externas) ---
    const toMinutes = (hhmm) => {
        const [h, m] = String(hhmm).split(":").map(Number);
        return h * 60 + (m || 0);
    };
    const getMonday = (d) => {
        const x = new Date(d);
        const day = x.getDay(); // 0=Dom ... 1=Lun
        const diff = (day === 0 ? -6 : 1 - day);
        x.setDate(x.getDate() + diff);
        x.setHours(0, 0, 0, 0);
        return x;
    };
    const addDays = (d, n) => {
        const x = new Date(d);
        x.setDate(x.getDate() + n);
        return x;
    };
    const toISODate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const da = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${da}`;
    };
    const formatDate = (d) =>
        `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    const weekdayLabel = (d) =>
        ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][d.getDay()];

    const getWeekDays = (monday) =>
        Array.from({ length: 7 }, (_, i) => addDays(monday, i));

    // Construye slots de 60 min: [{label:"09:00", startMin:540, endMin:600}, ...]
    const buildTimeSlots = (startHH = JORNADA_INICIO, endHH = JORNADA_FIN, stepMin = SLOT_MINUTES) => {
        const slots = [];
        let cur = startHH;
        while (cur < endHH) {
            const s = toMinutes(cur);
            const e = s + stepMin;
            slots.push({ label: cur, startMin: s, endMin: e });
            // avanzar
            const h = Math.floor(e / 60);
            const m = e % 60;
            cur = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }
        return slots;
    };

    // ¿El bloque [slot.startMin, slot.endMin) se solapa con la cita [ini, fin)?
    const overlapSlotWithCita = (slot, cita) => {
        const ini = new Date(cita.fechaHoraInicio);
        const fin = new Date(cita.fechaHoraFin);
        const citaStartMin = ini.getHours() * 60 + ini.getMinutes();
        const citaEndMin   = fin.getHours() * 60 + fin.getMinutes();
        return slot.startMin < citaEndMin && citaStartMin < slot.endMin;
    };

    // --- Estado / datos ---
    const [startOfWeek, setStartOfWeek] = useState(getMonday(new Date()));
    const [cargando, setCargando] = useState(false);
    const [citasSemana, setCitasSemana] = useState({}); // { 'YYYY-MM-DD': Cita[] }
    const [error, setError] = useState(null);

    const dias  = getWeekDays(startOfWeek);
    const slots = buildTimeSlots(JORNADA_INICIO, JORNADA_FIN, SLOT_MINUTES);

    useEffect(() => {
        let cancelado = false;
        (async () => {
            try {
                setCargando(true);
                setError(null);
                const resultados = {};
                for (const d of dias) {
                    const iso = toISODate(d);
                    const res = await fetch(`${API_BASE}/barberos/${barbero.id}/agenda?dia=${iso}`);
                    if (!res.ok) {
                        const txt = await leerMensajeServidor(res);
                        throw new Error(`No se pudo cargar agenda de ${iso}: ${txt}`);
                    }
                    const citas = await res.json();
                    resultados[iso] = Array.isArray(citas) ? citas : [];
                }
                if (!cancelado) setCitasSemana(resultados);
            } catch (e) {
                if (!cancelado) setError(e?.message || "Error al cargar la agenda");
            } finally {
                if (!cancelado) setCargando(false);
            }
        })();
        return () => { cancelado = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startOfWeek, barbero?.id]);

    const irAnterior  = () => setStartOfWeek((d) => addDays(d, -7));
    const irSiguiente = () => setStartOfWeek((d) => addDays(d, 7));
    const tituloSemana = `${formatDate(dias[0])} – ${formatDate(dias[6])}`;

    return (
        <div className="bg-white rounded-2xl shadow-sm border">
            <div className="p-4 border-b flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold">Agenda semanal — {barbero?.nombre}</h3>
                    <p className="text-sm text-gray-500">{tituloSemana}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={irAnterior} className="px-3 py-1 border rounded hover:bg-gray-50">◀ Semana</button>
                    <button onClick={() => setStartOfWeek(getMonday(new Date()))} className="px-3 py-1 border rounded hover:bg-gray-50">Hoy</button>
                    <button onClick={irSiguiente} className="px-3 py-1 border rounded hover:bg-gray-50">Semana ▶</button>
                    {onCerrar && (
                        <button onClick={onCerrar} className="ml-2 px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-800">Cerrar</button>
                    )}
                </div>
            </div>

            <div className="px-4 pt-3 pb-1 text-sm flex items-center gap-4">
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 inline-block rounded bg-green-500/80"></span> Disponible
        </span>
                <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 inline-block rounded bg-red-500/80"></span> Ocupado (cita)
        </span>
            </div>

            {error && <div className="px-4 pb-3 text-red-600 text-sm">{error}</div>}
            {cargando && <div className="px-4 pb-3 text-gray-600 text-sm">Cargando…</div>}

            <div className="p-4 overflow-auto">
                <div className="min-w-[900px]">
                    {/* Cabecera de horas */}
                    <div className="grid" style={{ gridTemplateColumns: `160px repeat(${slots.length}, minmax(48px,1fr))` }}>
                        <div></div>
                        {slots.map((s, i) => (
                            <div key={i} className="text-xs text-gray-500 px-1">{s.label}</div>
                        ))}
                    </div>

                    {/* Filas por día */}
                    {dias.map((d) => {
                        const iso = toISODate(d);
                        const citas = citasSemana[iso] || [];
                        return (
                            <div key={iso} className="grid" style={{ gridTemplateColumns: `160px repeat(${slots.length}, minmax(48px,1fr))` }}>
                                <div className="sticky left-0 bg-white pr-2 py-2 border-b z-10">
                                    <div className="font-medium">{weekdayLabel(d)}</div>
                                    <div className="text-xs text-gray-500">{formatDate(d)}</div>
                                </div>

                                {slots.map((slot, idx) => {
                                    const isBooked = citas.some((c) => overlapSlotWithCita(slot, c));
                                    const bg = isBooked ? "bg-red-500/80" : "bg-green-500/80";
                                    const title = isBooked ? "Ocupado" : "Disponible";
                                    const clickable = !isBooked && typeof onSlotClick === "function";
                                    return (
                                        <div
                                            key={idx}
                                            className={`h-9 border-b border-r ${bg} hover:brightness-95 transition ${clickable ? "cursor-pointer" : ""}`}
                                            title={`${weekdayLabel(d)} ${slot.label} — ${title}`}
                                            onClick={() => {
                                                if (!clickable) return;
                                                onSlotClick({
                                                    dayISO: iso,
                                                    startMin: slot.startMin,
                                                    endMin: slot.endMin
                                                });
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="px-4 pb-4 text-xs text-gray-500">
                <p>
                    <strong>Nota:</strong> Bloques verdes = libres entre {JORNADA_INICIO}–{JORNADA_FIN} descontando citas. Si el backend expone disponibilidad exacta por día, se puede pintar con mayor precisión.
                </p>
            </div>
        </div>
    );
}

/* ======= Utils Agenda ======= */
function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0=Dom, 1=Lun...
    const diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    d.setHours(0,0,0,0);
    return d;
}
function getWeekDays(monday) {
    // monday debe ser el lunes de la semana (ya lo calculas con getMonday)
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}
function toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,"0");
    const d = String(date.getDate()).padStart(2,"0");
    return `${y}-${m}-${d}`;
}
function weekdayLabel(date) {
    const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
    return dias[date.getDay()];
}
function formatDate(date) {
    return date.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit" });
}
function parseHHMM(hhmm) {
    const [h,m] = hhmm.split(":").map(Number);
    return (h*60)+m;
}
function buildTimeSlots(hhIni, hhFin, stepMin) {
    const start = parseHHMM(hhIni);
    const end = parseHHMM(hhFin);
    const out = [];
    for (let t = start; t < end; t += stepMin) {
        const t2 = t + stepMin;
        out.push({
            startMin: t,
            endMin: t2,
            label: `${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`
        });
    }
    return out;
}
function isoToMinutes(iso) {
    const d = new Date(iso);
    return d.getHours()*60 + d.getMinutes();
}
function overlapSlotWithCita(slot, cita) {
    const cStart = isoToMinutes(cita.fechaHoraInicio);
    const cEnd   = isoToMinutes(cita.fechaHoraFin);
    return slot.startMin < cEnd && slot.endMin > cStart;
}
function minutesToHHMM(min) {
    const h = Math.floor(min/60);
    const m = min%60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}
