function generarTarjeton() {
    const tarjeton = {
      B: [],
      I: [],
      N: [],
      G: [],
      O: [],
    };
  
    const rangos = {
      B: [1, 15],
      I: [16, 30],
      N: [31, 45],
      G: [46, 60],
      O: [61, 75],
    };
  
    // Generar números únicos para cada columna
    for (const [columna, [min, max]] of Object.entries(rangos)) {
      const numeros = new Set();
      while (numeros.size < 5) {
        const numero = Math.floor(Math.random() * (max - min + 1)) + min;
        numeros.add(numero); 
      }
      tarjeton[columna] = Array.from(numeros); // Convertir Set a Array
    }
  
    // Asignar "FREE" al centro del tarjetón
    tarjeton.N[2] = "FREE";
  
    console.log("Tarjetón generado:", tarjeton); 
    return tarjeton;
  }
  
  module.exports = generarTarjeton;
  