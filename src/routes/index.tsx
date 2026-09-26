import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CATEGORIAS,
  CUBICULOS,
  minutosAHora,
  useCubiculos,
  type Cubiculo,
} from "@/lib/cubiculos-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tablero de cubículos — CubículosUTP" },
      {
        name: "description",
        content:
          "Estado en tiempo real de los cubículos de ensayo musical de la UTP: libres, ocupados, en clase o fuera de servicio.",
      },
      { property: "og:title", content: "Tablero de cubículos — CubículosUTP" },
      {
        property: "og:description",
        content:
          "Consulta qué cubículos de ensayo están libres y registra un préstamo en segundos.",
      },
    ],
  }),
  component: Dashboard,
});

const estiloEstado = {
  libre: "border-estado-libre/40 bg-estado-libre/10",
  ocupado: "border-estado-ocupado/40 bg-estado-ocupado/10",
  clase: "border-estado-clase/40 bg-estado-clase/10",
  dañado: "border-estado-danado/40 bg-estado-danado/10",
} as const;

const puntoEstado = {
  libre: "bg-estado-libre",
  ocupado: "bg-estado-ocupado",
  clase: "bg-estado-clase",
  dañado: "bg-estado-danado",
} as const;

const etiquetaEstado = {
  libre: "Libre",
  ocupado: "Ocupado",
  clase: "Clase docente",
  dañado: "Fuera de servicio",
} as const;

function Dashboard() {
  const { estadoDe, reservaActiva, ahora } = useCubiculos();

  const estados = CUBICULOS.map((c) => estadoDe(c));
  const total = CUBICULOS.length;
  const disponibles = estados.filter((e) => e === "libre").length;
  const ocupados = estados.filter((e) => e === "ocupado" || e === "clase").length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-5">
      <header className="mb-5">
        <p className="text-sm text-muted-foreground">Piso 3 · Cubículos de ensayo del CRIE</p>
        <h1 className="text-2xl font-bold tracking-tight">Tablero de cubículos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hora de referencia: {minutosAHora(ahora)}
        </p>
      </header>

      <section className="mb-6 grid grid-cols-3 gap-3">
        <Resumen valor={total} etiqueta="Cubículos" />
        <Resumen valor={disponibles} etiqueta="Disponibles" tono="libre" />
        <Resumen valor={ocupados} etiqueta="Ocupados" tono="ocupado" />
      </section>

      <div className="space-y-7">
        {CATEGORIAS.map((cat) => (
          <section key={cat}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">
              {cat}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {CUBICULOS.filter((c) => c.categoria === cat).map((c) => (
                <Tarjeta key={c.id} cubiculo={c} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Resumen({
  valor,
  etiqueta,
  tono,
}: {
  valor: number;
  etiqueta: string;
  tono?: "libre" | "ocupado";
}) {
  const color =
    tono === "libre"
      ? "text-estado-libre"
      : tono === "ocupado"
        ? "text-estado-ocupado"
        : "text-primary";
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center shadow-sm">
      <p className={`text-3xl font-bold ${color}`}>{valor}</p>
      <p className="text-xs text-muted-foreground">{etiqueta}</p>
    </div>
  );
}

function Tarjeta({ cubiculo }: { cubiculo: Cubiculo }) {
  const { estadoDe, reservaActiva, ahora } = useCubiculos();
  const estado = estadoDe(cubiculo);
  const reserva = reservaActiva(cubiculo.id);

  const progreso = reserva
    ? Math.min(100, Math.max(0, ((ahora - reserva.inicio) / (reserva.fin - reserva.inicio)) * 100))
    : 0;
  const restante = reserva ? Math.max(0, reserva.fin - ahora) : 0;

  return (
    <div className={`rounded-xl border p-3 shadow-sm ${estiloEstado[estado]}`}>
      <div className="flex items-start justify-between">
        <span className="text-2xl font-bold leading-none">{cubiculo.numero}</span>
        <span className={`mt-1 size-3 rounded-full ${puntoEstado[estado]}`} aria-hidden />
      </div>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{etiquetaEstado[estado]}</p>

      {estado === "ocupado" && reserva && (
        <div className="mt-2">
          <p className="text-xs font-semibold tabular-nums">C.C. {reserva.cedula}</p>
          <p className="text-xs text-muted-foreground">
            Libre a las {minutosAHora(reserva.fin)} · faltan {restante} min
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-estado-ocupado/20">
            <div className="h-full rounded-full bg-estado-ocupado" style={{ width: `${progreso}%` }} />
          </div>
        </div>
      )}

      {estado === "clase" && reserva && (
        <p className="mt-2 text-xs text-muted-foreground">
          {reserva.docente} · hasta {minutosAHora(reserva.fin)}
        </p>
      )}

      {estado === "dañado" && (
        <p className="mt-2 text-xs text-muted-foreground">En mantenimiento</p>
      )}

      {estado === "libre" && (
        <Link
          to="/nueva-reserva"
          search={{ cubiculo: cubiculo.id }}
          className="mt-3 flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + Reserva rápida
        </Link>
      )}
    </div>
  );
}
