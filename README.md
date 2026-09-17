# Cubículos UTP

Actúa como un diseñador senior experto en desarrollo de aplicaciones

web en Colombia, especializado en sistemas administrativos para

instituciones educativas.

Crea una aplicación web llamada "CubículosUTP" para el personal

administrativo de un piso de la Universidad Tecnológica de Pereira

que gestiona el préstamo de cubículos de ensayo musical y hoy lo

lleva a mano en Excel, perdiendo tiempo revisando quién ocupa cada

espacio y por cuánto tiempo más.

Función central: ver en tiempo real el estado de cada cubículo,

registrar un préstamo a un estudiante en segundos, y saber cuándo

se libera cada uno.

Pantallas (solo estas 3):

1. Dashboard: grilla de cubículos agrupados por categoría de

   instrumento (Clavinova, Piano, Cuerdas, Vientos). Cada tarjeta

   muestra el número del cubículo con un color según su estado:

   verde=libre, rojo=ocupado (con la cédula y una barra de progreso

   del tiempo restante), morado=clase de un docente, naranja=dañado.

   Arriba, un resumen con total de cubículos, disponibles y

   ocupados. Botón grande "+ Reserva rápida" en cada tarjeta libre.

2. Nueva reserva: formulario con cédula del estudiante, si es

   carrera de Música (máx. 4h/día) u otra carrera (máx. 2h/día),

   hora de inicio y fin (bloques de 30 min, entre 7:00am y 8:00pm),

   selector de cubículo (los ocupados aparecen en gris) y un campo

   de notas opcional.

3. Historial de reservas: lista del día con filtro por cédula,

   mostrando cubículo, horario y estado (activa, finalizada,

   cancelada), con un botón para cancelar una reserva activa.

Estilo: limpio y profesional, azul y blanco como colores base pero

usando verde/rojo/morado/naranja para los estados de los cubículos,

tipografía clara, mobile-first porque se usa desde un celular o

tablet en la recepción.

Todos los textos en español colombiano. Usa datos de ejemplo

realistas: cubículos numerados como "21", "18A", "43"; cédulas

colombianas de 8 a 10 dígitos; nombres de estudiantes ficticios.

NO incluyas: login, importar/exportar Excel, clases recurrentes de

docentes, ni notificaciones. Eso viene después.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d33a7089-aadf-42c0-97c1-0b6318b68533).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
