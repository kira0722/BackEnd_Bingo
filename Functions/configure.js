const mysql = require("mysql2");
const jugadores = {};
const balotasEmitidas = [];
let juegoId = null;

function configurarBingo(io, db) {
  io.on("connection", (socket) => {
    console.log(`Jugador conectado: ${socket.id}`);

    // Registrar un nuevo jugador
    socket.on("unirseJuego", () => {
      const tarjeton = generarTarjeton();
      jugadores[socket.id] = { tarjeton, marcado: [] };
      socket.emit("tarjeton", tarjeton);
    });

    // Iniciar un nuevo juego
    socket.on("iniciarJuego", (nombreJuego) => {
      const fechaInicio = new Date();
      db.query(
        "INSERT INTO Juegos (nombre, fecha_inicio) VALUES (?, ?)",
        [nombreJuego, fechaInicio],
        (err, results) => {
          if (err) {
            console.error("Error al crear el juego:", err);
          } else {
            juegoId = results.insertId;
            console.log(`Juego iniciado: ID ${juegoId}`);
            io.emit("juegoIniciado", { juegoId, nombreJuego });
          }
        }
      );
    });

    // Cuando una balota es emitida
    socket.on("emitirBalota", (balota) => {
      balotasEmitidas.push(balota);
      if (juegoId) {
        db.query(
          "INSERT INTO Balotas (juego_id, balota) VALUES (?, ?)",
          [juegoId, balota],
          (err) => {
            if (err) {
              console.error("Error al guardar la balota:", err);
            } else {
              console.log(`Balota ${balota} guardada para el juego ${juegoId}`);
            }
          }
        );
      }
      io.emit("nuevaBalota", balota);
    });

    // Cuando un jugador marca una celda
    socket.on("marcarCelda", ({ columna, fila }) => {
      if (
        jugadores[socket.id] &&
        jugadores[socket.id].tarjeton[columna][fila] === balotasEmitidas[balotasEmitidas.length - 1]
      ) {
        jugadores[socket.id].marcado.push(`${columna}${fila + 1}`);
      }
    });

    // Cuando un jugador presiona "BINGO"
    socket.on("bingo", () => {
      const jugador = jugadores[socket.id];
      if (verificarVictoria(jugador)) {
        const modoVictoria = determinarModoVictoria(jugador);
        db.query(
          "INSERT INTO Ganadores (juego_id, jugador_id, modo_victoria) VALUES (?, ?, ?)",
          [juegoId, socket.id, modoVictoria],
          (err) => {
            if (err) {
              console.error("Error al registrar al ganador:", err);
            } else {
              console.log(`Ganador registrado: Jugador ${socket.id} con ${modoVictoria}`);
              io.emit("resultado", { ganador: socket.id, mensaje: "¡BINGO! Tenemos un ganador.", modoVictoria });
              reiniciarJuego();
            }
          }
        );
      } else {
        socket.emit("resultado", { ganador: null, mensaje: "Has sido descalificado." });
        socket.disconnect();
      }
    });

    // Desconectar al jugador
    socket.on("disconnect", () => {
      delete jugadores[socket.id];
      console.log(`Jugador desconectado: ${socket.id}`);
    });
  });
}

function reiniciarJuego() {
  balotasEmitidas.length = 0;
  for (const jugador in jugadores) {
    jugadores[jugador].marcado = [];
  }
}

function verificarVictoria(jugador) {
  const marcado = jugador.marcado;
  const pleno = marcado.length === 24;
  const diagonal = ['B5', 'I4', 'N3', 'G2', 'O1'].every((pos) => marcado.includes(pos));
  const vertical = ['G5', 'G4', 'G3', 'G2', 'G1'].every((pos) => marcado.includes(pos));
  const horizontal = ['B4', 'I4', 'N4', 'G4', 'O4'].every((pos) => marcado.includes(pos));
  const esquinas = ['B1', 'B5', 'O1', 'O5'].every((pos) => marcado.includes(pos));
  return pleno || diagonal || vertical || horizontal || esquinas;
}

function determinarModoVictoria(jugador) {
  const marcado = jugador.marcado;
  if (marcado.length === 24) return "Cartón Pleno";
  if (['B5', 'I4', 'N3', 'G2', 'O1'].every((pos) => marcado.includes(pos))) return "Diagonal";
  if (['G5', 'G4', 'G3', 'G2', 'G1'].every((pos) => marcado.includes(pos))) return "Vertical";
  if (['B4', 'I4', 'N4', 'G4', 'O4'].every((pos) => marcado.includes(pos))) return "Horizontal";
  if (['B1', 'B5', 'O1', 'O5'].every((pos) => marcado.includes(pos))) return "Esquinas";
  return null;
}

module.exports = configurarBingo;
