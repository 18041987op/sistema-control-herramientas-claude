// test-db.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Conexión exitosa a MongoDB');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error al conectar a MongoDB:', err.message);
    process.exit(1);
  });