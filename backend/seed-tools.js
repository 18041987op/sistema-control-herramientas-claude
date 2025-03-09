// backend/seed-tools.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tool = require('./src/models/Tool');

// Cargar variables de entorno
dotenv.config();

// Lista de herramientas de taller automotriz
const automotiveTools = [
  {
    name: "Scanner OBD2 Autel MaxiCOM",
    category: "diagnostico",
    serialNumber: "SCAN-001",
    location: "Estante 3, Sección B",
    description: "Scanner avanzado para diagnóstico de todo tipo de vehículos. Compatible con protocolos OBD2, incluye diagnóstico de módulos, programación y funciones especiales.",
    status: "available"
  },
  {
    name: "Multímetro Digital Fluke",
    category: "electricidad",
    serialNumber: "MULT-002",
    location: "Estante 2, Sección A",
    description: "Multímetro profesional para medición de voltaje, corriente y resistencia. Incluye funciones de capacitancia, frecuencia y temperatura.",
    status: "available"
  },
  {
    name: "Cargador de A/C Robinair",
    category: "aire_acondicionado",
    serialNumber: "AC-003",
    location: "Estante 1, Sección C",
    description: "Equipo para carga y diagnóstico de sistemas de aire acondicionado automotriz. Compatible con refrigerante R134a.",
    status: "borrowed"
  },
  {
    name: "Tester de Batería Midtronics",
    category: "electricidad",
    serialNumber: "BAT-004",
    location: "Estante 2, Sección B",
    description: "Analizador de baterías digital para diagnóstico preciso de baterías, alternadores y sistemas de arranque.",
    status: "maintenance"
  },
  {
    name: "Pistola de Impacto Neumática Snap-on",
    category: "mecanica",
    serialNumber: "IMP-005",
    location: "Estante 4, Sección A",
    description: "Herramienta neumática de alto torque para remoción e instalación rápida de tornillos y tuercas.",
    status: "available"
  },
  {
    name: "Gato Hidráulico de Piso",
    category: "mecanica",
    serialNumber: "GAT-006",
    location: "Área de Elevación",
    description: "Gato de piso profesional con capacidad de 3 toneladas para levantar vehículos.",
    status: "available"
  },
  {
    name: "Juego de Llaves Combinadas",
    category: "mecanica",
    serialNumber: "LLAV-007",
    location: "Estante 5, Sección A",
    description: "Set de 22 llaves combinadas métricas y estándar desde 8mm hasta 24mm.",
    status: "borrowed"
  },
  {
    name: "Compresímetro para Motor",
    category: "diagnostico",
    serialNumber: "COMP-008",
    location: "Estante 3, Sección A",
    description: "Equipo para medir la compresión en los cilindros del motor. Incluye adaptadores para diferentes tipos de bujías.",
    status: "available"
  },
  {
    name: "Alineadora Hunter",
    category: "neumaticos",
    serialNumber: "ALIN-009",
    location: "Área de Alineación",
    description: "Sistema computarizado para alineación de dirección de vehículos. Incluye cámaras de alta precisión y software especializado.",
    status: "available"
  },
  {
    name: "Balanceadora de Ruedas",
    category: "neumaticos",
    serialNumber: "BAL-010",
    location: "Área de Neumáticos",
    description: "Equipo para balanceo dinámico de neumáticos. Capacidad hasta aros de 24 pulgadas.",
    status: "available"
  },
  {
    name: "Torquímetro Digital",
    category: "mecanica",
    serialNumber: "TORQ-011",
    location: "Estante 4, Sección B",
    description: "Herramienta digital para aplicación de torque preciso. Rango de 20-200 Nm con precisión del 2%.",
    status: "borrowed"
  },
  {
    name: "Endoscopio Automotriz",
    category: "diagnostico",
    serialNumber: "END-012",
    location: "Estante 3, Sección C",
    description: "Cámara de inspección con sonda flexible para visualizar áreas de difícil acceso en motores y carrocería.",
    status: "available"
  },
  {
    name: "Limpiador de Inyectores",
    category: "mecanica",
    serialNumber: "INY-013",
    location: "Estante 6, Sección A",
    description: "Equipo para limpieza ultrasónica de inyectores de combustible. Incluye solución de limpieza y adaptadores.",
    status: "available"
  },
  {
    name: "Soldadora MIG",
    category: "otros",
    serialNumber: "SOLD-014",
    location: "Área de Soldadura",
    description: "Soldadora de proceso MIG para trabajos en carrocería. Potencia de 200A con alimentador de alambre incorporado.",
    status: "maintenance"
  },
  {
    name: "Compresor de Aire Industrial",
    category: "otros",
    serialNumber: "COMP-015",
    location: "Sala de Máquinas",
    description: "Compresor de 5HP con tanque de 80 galones para alimentación de herramientas neumáticas.",
    status: "available"
  },
  {
    name: "Juego de Destornilladores",
    category: "mecanica",
    serialNumber: "DEST-016",
    location: "Estante 5, Sección B",
    description: "Set completo de destornilladores de precisión incluyendo tipos Phillips, planos, Torx y Allen.",
    status: "available"
  },
  {
    name: "Medidor de Presión de Neumáticos Digital",
    category: "neumaticos",
    serialNumber: "PRES-017",
    location: "Estante 6, Sección B",
    description: "Manómetro digital de alta precisión para verificación de presión de aire en neumáticos.",
    status: "available"
  },
  {
    name: "Arrancador de Baterías Portátil",
    category: "electricidad",
    serialNumber: "ARR-018",
    location: "Estante 2, Sección C",
    description: "Arrancador de emergencia de 12V para vehículos. Incluye protección contra cortocircuitos y carga inversa.",
    status: "borrowed"
  },
  {
    name: "Kit de Herramientas para Timing Belt",
    category: "mecanica",
    serialNumber: "TIM-019",
    location: "Estante 4, Sección C",
    description: "Set de herramientas especializadas para reemplazo de correa de distribución. Compatible con múltiples marcas.",
    status: "available"
  },
  {
    name: "Analizador de Gases de Escape",
    category: "diagnostico",
    serialNumber: "GAS-020",
    location: "Estante 3, Sección D",
    description: "Equipo para medición de emisiones de vehículos. Analiza CO, CO2, HC, O2 y NOx en gases de escape.",
    status: "available"
  }
];

// Función para conectar a la base de datos y agregar las herramientas
const seedDatabase = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conexión a MongoDB establecida para cargar datos de ejemplo');

    // Obtener el ID del administrador (puedes obtenerlo de la base de datos o usar uno fijo)
    // Para este ejemplo, usaremos un ID fijo que se debe reemplazar por uno real
    const adminId = "67cbba774ab86b5a6902cc84"; // Reemplaza con un ID de admin real

    // Agregar el campo addedBy a cada herramienta
    const toolsWithAdmin = automotiveTools.map(tool => ({
      ...tool,
      addedBy: adminId
    }));

    // Primero eliminar todas las herramientas existentes (opcional)
    // await Tool.deleteMany({});
    // console.log('Herramientas existentes eliminadas');

    // Agregar las nuevas herramientas
    await Tool.insertMany(toolsWithAdmin);
    console.log(`${automotiveTools.length} herramientas agregadas correctamente`);

    // Cerrar la conexión
    await mongoose.disconnect();
    console.log('Conexión a MongoDB cerrada');

    process.exit(0);
  } catch (error) {
    console.error('Error al cargar datos de ejemplo:', error);
    process.exit(1);
  }
};

// Ejecutar la función
seedDatabase();