import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
  nombre: string;
  esMusica: boolean;
  inicio: number; // minutos desde medianoche
  fin: number;
  notas?: string;
  estado: EstadoReserva;
  tipo: "estudiante" | "clase";
  docente?: string;
};

export const CATEGORIAS: Categoria[] = ["Clavinova", "Piano", "Cuerdas", "Vientos"];

export const CUBICULOS: Cubiculo[] = [
  { id: "c1", numero: "18A", categoria: "Clavinova" },
  { id: "c2", numero: "19", categoria: "Clavinova" },
  { id: "c3", numero: "20", categoria: "Clavinova" },
  { id: "c4", numero: "21", categoria: "Clavinova" },
  { id: "c5", numero: "27", categoria: "Piano" },
  { id: "c6", numero: "28", categoria: "Piano" },
  { id: "c7", numero: "29B", categoria: "Piano" },
  { id: "c8", numero: "34", categoria: "Cuerdas" },
  { id: "c9", numero: "35", categoria: "Cuerdas" },
  { id: "c10", numero: "36A", categoria: "Cuerdas", fueraDeServicio: true },
  { id: "c11", numero: "41", categoria: "Vientos" },
  { id: "c12", numero: "42", categoria: "Vientos" },
  { id: "c13", numero: "43", categoria: "Vientos" },
];

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

const RESERVAS_SEED: Reserva[] = [
  {
    id: "r1",
    cubiculoId: "c2",
    cedula: "1088342119",
    nombre: "Valentina Ospina Rendón",
    esMusica: true,
    inicio: AHORA_SEED - 50,
    fin: AHORA_SEED + 70,
    estado: "activa",
    tipo: "estudiante",
    notas: "Ensayo de recital de grado",
  },
  {
    id: "r2",
    cubiculoId: "c6",
    cedula: "1004567821",
    nombre: "Juan Esteban Marín Loaiza",
    esMusica: false,
    inicio: AHORA_SEED - 20,
    fin: AHORA_SEED + 40,
    estado: "activa",
    tipo: "estudiante",
  },
  {
    id: "r3",
    cubiculoId: "c9",
    cedula: "94523187",
    nombre: "Docente Hernán Gallego",
    esMusica: true,
    inicio: AHORA_SEED - 80,
    fin: AHORA_SEED + 100,
    estado: "activa",
    tipo: "clase",
    docente: "Hernán Gallego",
    notas: "Clase grupal de cuerdas frotadas",
  },
  {
    id: "r4",
    cubiculoId: "c13",
    cedula: "1112998745",
    nombre: "Laura Camila Betancur",
    esMusica: true,
    inicio: AHORA_SEED - 15,
    fin: AHORA_SEED + 105,
    estado: "activa",
    tipo: "estudiante",
  },
  {
    id: "r5",
    cubiculoId: "c4",
    cedula: "1088342119",
    nombre: "Valentina Ospina Rendón",
    esMusica: true,
    inicio: 7 * 60 + 30,
    fin: 9 * 60,
    estado: "finalizada",
    tipo: "estudiante",
  },
  {
    id: "r6",
    cubiculoId: "c12",
    cedula: "10254789",
    nombre: "Andrés Felipe Quintero",
    esMusica: false,
    inicio: 8 * 60,
    fin: 9 * 60 + 30,
    estado: "cancelada",
    tipo: "estudiante",
    notas: "El estudiante no se presentó",
  },
  {
    id: "r7",
    cubiculoId: "c8",
    cedula: "1053982311",
    nombre: "Mariana Zapata Ríos",
    esMusica: true,
    inicio: 9 * 60,
    fin: 10 * 60,
    estado: "finalizada",
    tipo: "estudiante",
  },
];

type Ctx = {
  ahora: number;
  reservas: Reserva[];
  reservaActiva: (cubiculoId: string) => Reserva | undefined;
  estadoDe: (c: Cubiculo) => EstadoCubiculo;
  crearReserva: (r: Omit<Reserva, "id" | "estado" | "tipo">) => void;
  cancelarReserva: (id: string) => void;
  minutosUsadosHoy: (cedula: string) => number;
};

const StoreContext = createContext<Ctx | null>(null);

export function CubiculosProvider({ children }: { children: ReactNode }) {
  const [reservas, setReservas] = useState<Reserva[]>(RESERVAS_SEED);
  const [ahora, setAhora] = useState(AHORA_SEED);

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

  const crearReserva: Ctx["crearReserva"] = useCallback((data) => {
    setReservas((prev) => [
      ...prev,
      { ...data, id: `r${Date.now()}`, estado: "activa", tipo: "estudiante" },
    ]);
  }, []);

  const cancelarReserva = useCallback((id: string) => {
    setReservas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, estado: "cancelada" } : r)),
    );
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
      reservas,
      reservaActiva,
      estadoDe,
      crearReserva,
      cancelarReserva,
      minutosUsadosHoy,
    }),
    [ahora, reservas, reservaActiva, estadoDe, crearReserva, cancelarReserva, minutosUsadosHoy],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useCubiculos() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useCubiculos debe usarse dentro de CubiculosProvider");
  return ctx;
}
