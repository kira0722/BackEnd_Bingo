require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const generarTarjeton = require('./Functions/Cards');
const configurarBingo = require('./Functions/configure');
const { emitirBalotas, balotasEmitidas } = require('./Functions/Ballots');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('error en la conexion');
    return;
  }
  console.log('conexion exitosa');
})

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Configuracion del servidor con el frontend
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});


// Endpoint de autenticación
app.post('/api/login', (req, res) => {
  const { USER, PASS } = req.body;

  const query = 'SELECT * FROM USERS WHERE USER = ? AND PASS = ?';
  db.query(query, [USER, PASS], (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err);
      res.status(500).send('Error en el servidor');
    } else if (results.length > 0) {
      // const userName = results[0].user; 
      res.status(200).json({
        success: true,
        message: 'Usuario autenticado',
        // user: userName,
      });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
  });
});

// Manejo de conexiones de WebSocket
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

configurarBingo(io);


// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});