require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const configurarBingo = require("./Functions/configure");
const generarTarjeton = require("./Functions/Cards");
const { emitirBalotas, balotasEmitidas } = require("./Functions/Ballots");

//configuracion y conexion con la base de datos, de acuerdo a las credenciales del archivo configurado (.env)
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("error en la conexion");
    return;
  }
  console.log("conexion exitosa");
});

//configuracion del puerto y creacion del servidor
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Configurar la direccion para la conexion con el frontend
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Endpoint del login y autenticacion
app.post("/api/login", (req, res) => {
  const { USER, PASS } = req.body;

  const query = "SELECT * FROM USERS WHERE USER = ? AND PASS = ?";
  db.query(query, [USER, PASS], (err, results) => {
    if (err) {
      console.error("Error en la consulta:", err);
      res.status(500).send("Error en el servidor");
    } else if (results.length > 0) {
      // const userName = results[0].user;
      res.status(200).json({
        success: true,
        message: "Bienvenido",
        // user: userName,
      });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Credenciales incorrectas" });
    }
  });
});



// Manejo de conexiones de WebSocket cuando un usuario se conecta
io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);
  
    const tarjeton = generarTarjeton();
    console.log("tarjeton generado: ", tarjeton);
    socket.emit("tarjeton", tarjeton);
  
    
    socket.emit("balotasEmitidas", balotasEmitidas);
  
    // Escuchar eventos del cliente (opcional)
    socket.on("mensaje", (data) => {
      console.log("Mensaje del cliente:", data);
    });
  
    // Manejar la desconexión
    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });
  
  emitirBalotas(io);
  
  configurarBingo(io, db);
  
  
  // Iniciar el servidor
  server.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  });