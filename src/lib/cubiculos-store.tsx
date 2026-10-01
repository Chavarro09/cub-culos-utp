import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

export type Categoria = "Clavinova" | "Piano" | "Cuerdas" | "Vientos";
export type EstadoCubiculo = "libre" | "ocupado" | "clase" | "dañado";
export type EstadoReserva = "activa" | "finalizada" | "cancelada";

export type Cubiculo = {
  id: string;
  numero: string;
  categoria: Categoria;
  fueraDeServicio?: boolean;
};

export type Reserva = {
  id: string;
  cubiculoId: string;
  cedula: string;
  esMusica: boolean;
  inicio: number; // minutos desde medianoche
  fin: number;
  notas?: string;
  estado: EstadoReserva;
  tipo: "estudiante" | "clase";
  docente?: string;
};

export const CATEGORIAS: Categoria[] = ["Clavinova", "Piano", "Cuerdas", "Vientos"];

export function minutosAHora(min: number) {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const sufijo = h24 >= 12 ? "p. m." : "a. m.";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
}

export const BLOQUES: number[] = (() => {
  const out: number[] = [];
  for (let m = 7 * 60; m <= 20 * 60; m += 30) out.push(m);
  return out;
})();

function minutosAhora() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

const AHORA_SEED = 10 * 60 + 20;

// Fila de la tabla prestamos tal como la devuelve Supabase.
type FilaPrestamo = {
  id: string;
  cubiculo_id: string;
  cedula: string;
  programa: "Música" | "Otra carrera";
  inicio: string;
  fin: string;
  estado: EstadoReserva;
  notas: string | null;
};

// La app trabaja en minutos desde medianoche; la base guarda fecha y hora completas.
function aMinutos(fechaHora: string) {
  const d = new Date(fechaHora);
  return d.getHours() * 60 + d.getMinutes();
}

// Minutos desde medianoche de hoy → fecha y hora completa para guardar en la base.
function aFechaHora(minutos: number) {
  const d = new Date();
  d.setHours(0, minutos, 0, 0);
  return d.toISOString();
}

function aReserva(f: FilaPrestamo): Reserva {
  return {
    id: f.id,
    cubiculoId: f.cubiculo_id,
    cedula: f.cedula,
    esMusica: f.programa === "Música",
    inicio: aMinutos(f.inicio),
    fin: aMinutos(f.fin),
    estado: f.estado,
    tipo: "estudiante",
    ...(f.notas ? { notas: f.notas } : {}),
  };
}

type Ctx = {
  ahora: number;
  cubiculos: Cubiculo[];
  reservas: Reserva[];
  reservaActiva: (cubiculoId: string) => Reserva | undefined;
  estadoDe: (c: Cubiculo) => EstadoCubiculo;
  // Devuelven un mensaje de error si la base no aceptó el cambio, o null si se guardó.
  crearReserva: (r: Omit<Reserva, "id" | "estado" | "tipo">) => Promise<string | null>;
  cancelarReserva: (id: string) => Promise<string | null>;
  minutosUsadosHoy: (cedula: string) => number;
};

const StoreContext = createContext<Ctx | null>(null);

export function CubiculosProvider({ children }: { children: ReactNode }) {
  const [cubiculos, setCubiculos] = useState<Cubiculo[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [ahora, setAhora] = useState(AHORA_SEED);

  // Carga los cubículos del piso 3 y los préstamos de hoy desde Supabase.
  useEffect(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    supabase
      .from("cubiculos")
      .select("id, numero, instrumento, fuera_de_servicio")
      .eq("piso", 3)
      .order("numero")
      .then(({ data, error }) => {
        if (error) return console.error("No se pudieron cargar los cubículos:", error.message);
        setCubiculos(
          data.map((c) => ({
            id: c.id,
            numero: c.numero,
            categoria: c.instrumento as Categoria,
            fueraDeServicio: c.fuera_de_servicio,
          })),
        );
      });

    supabase
      .from("prestamos")
      .select("id, cubiculo_id, cedula, programa, inicio, fin, estado, notas")
      .gte("inicio", hoy.toISOString())
      .lt("inicio", manana.toISOString())
      .then(({ data, error }) => {
        if (error) return console.error("No se pudieron cargar los préstamos:", error.message);
        setReservas((data as FilaPrestamo[]).map(aReserva));
      });
  }, []);

  useEffect(() => {
    setAhora(minutosAhora());
    const t = setInterval(() => setAhora(minutosAhora()), 30_000);
    return () => clearInterval(t);
  }, []);

  const reservaActiva = useCallback(
    (cubiculoId: string) =>
      reservas.find(
        (r) =>
          r.cubiculoId === cubiculoId &&
          r.estado === "activa" &&
          r.inicio <= ahora &&
          r.fin > ahora,
      ),
    [reservas, ahora],
  );

  const estadoDe = useCallback(
    (c: Cubiculo): EstadoCubiculo => {
      if (c.fueraDeServicio) return "dañado";
      const r = reservaActiva(c.id);
      if (!r) return "libre";
      return r.tipo === "clase" ? "clase" : "ocupado";
    },
    [reservaActiva],
  );

  const crearReserva: Ctx["crearReserva"] = useCallback(async (data) => {
    const { data: fila, error } = await supabase
      .from("prestamos")
      .insert({
        cubiculo_id: data.cubiculoId,
        cedula: data.cedula,
        programa: data.esMusica ? "Música" : "Otra carrera",
        inicio: aFechaHora(data.inicio),
        fin: aFechaHora(data.fin),
        notas: data.notas ?? null,
      })
      .select("id, cubiculo_id, cedula, programa, inicio, fin, estado, notas")
      .single();
    if (error) return error.message;
    setReservas((prev) => [...prev, aReserva(fila as FilaPrestamo)]);
    return null;
  }, []);

  const cancelarReserva: Ctx["cancelarReserva"] = useCallback(async (id) => {
    const { error } = await supabase.from("prestamos").update({ estado: "cancelada" }).eq("id", id);
    if (error) return error.message;
    setReservas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, estado: "cancelada" } : r)),
    );
    return null;
  }, []);

  const minutosUsadosHoy = useCallback(
    (cedula: string) =>
      reservas
        .filter((r) => r.cedula === cedula && r.estado !== "cancelada")
        .reduce((acc, r) => acc + (r.fin - r.inicio), 0),
    [reservas],
  );

  const value = useMemo(
    () => ({
      ahora,
      cubiculos,
      reservas,
      reservaActiva,
      estadoDe,
      crearReserva,
      cancelarReserva,
      minutosUsadosHoy,
    }),
    [ahora, cubiculos, reservas, reservaActiva, estadoDe, crearReserva, cancelarReserva, minutosUsadosHoy],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useCubiculos() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useCubiculos debe usarse dentro de CubiculosProvider");
  return ctx;
}
