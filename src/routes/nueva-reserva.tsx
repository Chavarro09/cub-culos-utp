import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BLOQUES,
  CUBICULOS,
  minutosAHora,
  useCubiculos,
} from "@/lib/cubiculos-store";

type Busqueda = { cubiculo: string };

export const Route = createFileRoute("/nueva-reserva")({
  validateSearch: (search: Record<string, unknown>): Busqueda => ({
    cubiculo: typeof search["cubiculo"] === "string" ? (search["cubiculo"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Nueva reserva — CubículosUTP" },
      {
        name: "description",
        content:
          "Registra el préstamo de un cubículo de ensayo con cédula, horario en bloques de 30 minutos y cubículo disponible.",
      },
      { property: "og:title", content: "Nueva reserva — CubículosUTP" },
      {
        property: "og:description",
        content: "Registra en segundos el préstamo de un cubículo de ensayo musical.",
      },
    ],
  }),
  component: NuevaReserva,
});

function NuevaReserva() {
  const { cubiculo: cubiculoInicial } = Route.useSearch();
  const navigate = useNavigate();
  const { estadoDe, crearReserva, minutosUsadosHoy } = useCubiculos();

  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [esMusica, setEsMusica] = useState(true);
  const [inicio, setInicio] = useState<number>(7 * 60);
  const [fin, setFin] = useState<number>(8 * 60);
  const [cubiculoId, setCubiculoId] = useState(cubiculoInicial);
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);

  const topeMinutos = esMusica ? 240 : 120;

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{8,10}$/.test(cedula)) {
      setError("La cédula debe tener entre 8 y 10 dígitos.");
      return;
    }
    if (!cubiculoId) {
      setError("Selecciona un cubículo disponible.");
      return;
    }
    if (fin <= inicio) {
      setError("La hora de finalización debe ser posterior a la de inicio.");
      return;
    }
    const duracion = fin - inicio;
    if (duracion > topeMinutos) {
      setError(
        `El tope diario es de ${topeMinutos / 60} horas para ${esMusica ? "estudiantes de Música" : "otras carreras"}.`,
      );
      return;
    }
    if (minutosUsadosHoy(cedula) + duracion > topeMinutos) {
      setError("Esta cédula ya alcanzó su tope de horas para hoy.");
      return;
    }

    crearReserva({
      cubiculoId,
      cedula,
      nombre: nombre.trim() || "Estudiante sin registrar",
      esMusica,
      inicio,
      fin,
      notas: notas.trim() || undefined,
    });
    navigate({ to: "/historial" });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-5">
      <h1 className="text-2xl font-bold tracking-tight">Nueva reserva</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Diligencia los datos del estudiante y asigna el cubículo.
      </p>

      <form onSubmit={enviar} className="mt-5 space-y-5">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <Campo etiqueta="Cédula del estudiante">
            <input
              inputMode="numeric"
              value={cedula}
              onChange={(e) => setCedula(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="1088342119"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base tabular-nums outline-none focus:border-ring"
            />
          </Campo>

          <Campo etiqueta="Nombre (opcional)">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Valentina Ospina Rendón"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base outline-none focus:border-ring"
            />
          </Campo>

          <Campo etiqueta="Programa académico">
            <div className="grid grid-cols-2 gap-2">
              <Opcion activo={esMusica} onClick={() => setEsMusica(true)}>
                Música · máx. 4 h/día
              </Opcion>
              <Opcion activo={!esMusica} onClick={() => setEsMusica(false)}>
                Otra carrera · máx. 2 h/día
              </Opcion>
            </div>
          </Campo>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Hora de inicio">
              <select
                value={inicio}
                onChange={(e) => setInicio(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base outline-none focus:border-ring"
              >
                {BLOQUES.slice(0, -1).map((b) => (
                  <option key={b} value={b}>
                    {minutosAHora(b)}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Hora de finalización">
              <select
                value={fin}
                onChange={(e) => setFin(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base outline-none focus:border-ring"
              >
                {BLOQUES.filter((b) => b > inicio).map((b) => (
                  <option key={b} value={b}>
                    {minutosAHora(b)}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Bloques de 30 minutos entre 7:00 a. m. y 8:00 p. m.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-2 text-sm font-medium">Cubículo</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {CUBICULOS.map((c) => {
              const estado = estadoDe(c);
              const libre = estado === "libre";
              const activo = cubiculoId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={!libre}
                  onClick={() => setCubiculoId(c.id)}
                  className={`rounded-lg border px-2 py-2 text-sm font-semibold transition-colors ${
                    !libre
                      ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                      : activo
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary"
                  }`}
                >
                  {c.numero}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Los cubículos en gris están ocupados, en clase o fuera de servicio.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <Campo etiqueta="Notas (opcional)">
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              placeholder="Ensayo para recital, requiere atril adicional…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base outline-none focus:border-ring"
            />
          </Campo>
        </div>

        {error && (
          <p className="rounded-lg border border-estado-ocupado/40 bg-estado-ocupado/10 px-3 py-2 text-sm text-estado-ocupado">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Registrar préstamo
        </button>
      </form>
    </div>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block last:mb-0">
      <span className="mb-1 block text-sm font-medium">{etiqueta}</span>
      {children}
    </label>
  );
}

function Opcion({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        activo
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:border-primary"
      }`}
    >
      {children}
    </button>
  );
}
