const jugadores = {};
const balotasEmitidas = [];

function configurarBingo(io) {
  io.on("connection", (socket) => {
    console.log(`Jugador conectado: ${socket.id}`);

    // Registrar a un nuevo jugador
    socket.on("unirseJuego", () => {
      const tarjeton = generarTarjeton();
      jugadores[socket.id] = { tarjeton, marcado: [] };
      console.log(`Jugador registrado: ${socket.id}`, jugadores[socket.id]);
      socket.emit("tarjeton", tarjeton);
    });

    // Cuando un jugador marca una celda
    socket.on("marcarCelda", (celda) => {
      const { columna, fila } = celda;
      const numero = generarTarjeton()[columna][fila];

      if (!numero) {
        console.log(
          `Intento de marcar celda inválida: columna ${columna}, fila ${fila}`
        );
        socket.emit("error", { message: "Celda inválida" });
        return;
      }

      const celdaId = `${columna}${fila + 1}`;
      const jugador = jugadores[socket.id];

      if (!jugador) {
        console.log(`Jugador no encontrado: ${socket.id}`);
        return;
      }

      if (!jugador.marcado.includes(celdaId)) {
        jugador.marcado.push(celdaId);
        console.log(`Jugador ${socket.id} marcó la celda ${celdaId}`);
        socket.emit("celdaMarcada", celdaId);
      } else {
        console.log(`La celda ${celdaId} ya ha sido marcada.`);
        socket.emit("error", { message: "Esta celda ya ha sido marcada." });
      }
    });

    // Cuando un jugador presiona "BINGO"
    socket.on("bingo", () => {
      const jugador = jugadores[socket.id];
      if (!jugador) {
        socket.emit("resultado", {
          ganador: null,
          mensaje: "No estás registrado en el juego. Inicia Sesión",
        });
        return;
      }

      if (verificarVictoria(jugador)) {
        io.emit("resultado", {
          ganador: socket.id,
          mensaje: "¡BINGO! 🥳🎉✨ Tenemos un ganador. 🎀",
        });
        reiniciarJuego();
      } else {
        socket.emit("resultado", {
          ganador: null,
          mensaje: "Has sido descalificado. ☹️",
        });
        socket.disconnect();
      }
    });

    // Desconectar al jugador
    socket.on("disconnect", () => {
      console.log(`Jugador desconectado: ${socket.id}`);
      delete jugadores[socket.id];
    });
  });
}

function reiniciarJuego() {
  balotasEmitidas.length = 0;
  for (const jugadorId in jugadores) {
    jugadores[jugadorId].marcado = [];
  }
  console.log("Juego reiniciado. Estado de jugadores:", jugadores);
}

function verificarVictoria(jugador) {
  if (!jugador || !jugador.marcado || !jugador.tarjeton) return false;

  const marcado = jugador.marcado;
  const tarjeton = jugador.tarjeton;

  // Considerar "FREE" como marcada
  if (!marcado.includes("N3")) {
    marcado.push("N3");
  }

  console.log("Celdas marcadas por el jugador:", marcado);

  // Verificar las condiciones de victoria
  const pleno = marcado.length === 24; // Todas las celdas marcadas menos la "FREE"

  const diagonal = ["B5", "I4", "N3", "G2", "O1"].every((pos) =>
    marcado.includes(pos)
  );

  // Verificar horizontal: fila por fila
  const horizontal = Array.from({ length: 5 }).some((_, fila) =>
    ["B", "I", "N", "G", "O"].every((columna) =>
      marcado.includes(`${columna}${fila + 1}`)
    )
  );

  const vertical = ["B", "I", "N", "G", "O"].some((columna) =>
    tarjeton[columna].every((_, fila) =>
      marcado.includes(`${columna}${fila + 1}`)
    )
  );

  const esquinas = ["B1", "B5", "O1", "O5"].every((pos) =>
    marcado.includes(pos)
  );

  console.log({
    pleno,
    diagonal,
    horizontal,
    vertical,
    esquinas,
  });

  // Evaluar si alguna condición es verdadera
  return pleno || diagonal || horizontal || vertical || esquinas;
}

function generarTarjeton() {
  const tarjeton = { B: [], I: [], N: [], G: [], O: [] };
  for (let i = 0; i < 5; i++) {
    tarjeton.B.push(Math.floor(Math.random() * 15) + 1);
    tarjeton.I.push(Math.floor(Math.random() * 15) + 16);
    tarjeton.N.push(i === 2 ? "FREE" : Math.floor(Math.random() * 15) + 31);
    tarjeton.G.push(Math.floor(Math.random() * 15) + 46);
    tarjeton.O.push(Math.floor(Math.random() * 15) + 61);
  }
  console.log("Tarjetón generado:", tarjeton); // Verifica el formato
  return tarjeton;
}

module.exports = configurarBingo;
