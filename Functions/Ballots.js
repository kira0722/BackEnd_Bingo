const letras = ["B", "I", "N", "G", "O"];
const balotas = Array.from({ length: 75 }, (_, i) => {
  const letra = letras[Math.floor(i / 15)];
  return { letra, numero: i + 1, balota: `${letra}${i + 1}` };
}).sort(() => Math.random() - 0.5);
const balotasEmitidas = [];
let intervalo;

function emitirBalotas(io) {
  if (intervalo) clearInterval(intervalo);

  intervalo = setInterval(() => {
    if (balotasEmitidas.length >= balotas.length) {
      clearInterval(intervalo);
      console.log("Todas las balotas han sido emitidas.");
      return;
    }

    const balota = balotas.find((b) => !balotasEmitidas.includes(b));
    if (balota) {
      balotasEmitidas.push(balota);
      io.emit("balotaNueva", balota);
    }
  }, 5000);
}

module.exports = {
  emitirBalotas,
  balotasEmitidas,
};
