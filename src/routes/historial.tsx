import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { minutosAHora, useCubiculos, type EstadoReserva } from "@/lib/cubiculos-store";

export const Route = createFileRoute("/historial")({
  head: () => ({
    meta: [
      { title: "Historial del día — CubículosUTP" },
      {
        name: "description",
        content:
          "Consulta las reservas del día por cédula, revisa horarios y cancela préstamos activos de cubículos de ensayo.",
      },
      { property: "og:title", content: "Historial del día — CubículosUTP" },
      {
        property: "og:description",
        content: "Reservas del día con filtro por cédula y cancelación de préstamos activos.",
      },
    ],
  }),
  component: Historial,
});

const estiloEstado: Record<EstadoReserva, string> = {
  activa: "bg-estado-libre/15 text-estado-libre",
  finalizada: "bg-muted text-muted-foreground",
  cancelada: "bg-estado-ocupado/15 text-estado-ocupado",
};

function Historial() {
  const { reservas, cancelarReserva, ahora, cubiculos } = useCubiculos();
  const [filtro, setFiltro] = useState("");

  const lista = reservas
    .filter((r) => r.cedula.includes(filtro.trim()))
    .slice()
    .sort((a, b) => a.inicio - b.inicio);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-5">
      <h1 className="text-2xl font-bold tracking-tight">Historial del día</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {lista.length} reserva{lista.length === 1 ? "" : "s"} registrada
        {lista.length === 1 ? "" : "s"} hoy.
      </p>

      <input
        value={filtro}
        inputMode="numeric"
        onChange={(e) => setFiltro(e.target.value.replace(/\D/g, ""))}
        placeholder="Filtrar por cédula"
        className="mt-4 w-full rounded-lg border border-input bg-background px-3 py-2 text-base tabular-nums outline-none focus:border-ring"
      />

      <ul className="mt-4 space-y-3">
        {lista.map((r) => {
          const cub = cubiculos.find((c) => c.id === r.cubiculoId);
          const vigente = r.estado === "activa" && r.fin > ahora;
          const estadoVisible: EstadoReserva =
            r.estado === "activa" && r.fin <= ahora ? "finalizada" : r.estado;
          return (
            <li
              key={r.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    Cubículo {cub?.numero}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      · {cub?.categoria}
                    </span>
                  </p>
                  <p className="text-sm tabular-nums text-muted-foreground">
                    C.C. {r.cedula}
                    {r.nombre && ` · ${r.nombre}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {minutosAHora(r.inicio)} – {minutosAHora(r.fin)}
                  </p>
                  {r.notas && <p className="mt-1 text-xs text-muted-foreground">{r.notas}</p>}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${estiloEstado[estadoVisible]}`}
                >
                  {estadoVisible}
                </span>
              </div>

              {vigente && (
                <button
                  onClick={() => cancelarReserva(r.id)}
                  className="mt-3 w-full rounded-lg border border-estado-ocupado/50 px-3 py-2 text-sm font-semibold text-estado-ocupado transition-colors hover:bg-estado-ocupado/10"
                >
                  Cancelar reserva
                </button>
              )}
            </li>
          );
        })}
        {lista.length === 0 && (
          <li className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No hay reservas con esa cédula.
          </li>
        )}
      </ul>
    </div>
  );
}
