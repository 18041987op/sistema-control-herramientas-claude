// test-email.js
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Verificar que las variables necesarias existen
const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Error: Las siguientes variables de entorno son necesarias pero no están definidas:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  process.exit(1);
}

// Mostrar configuración (sin contraseña)
console.log('Configuración de email:');
console.log(`Host: ${process.env.SMTP_HOST}`);
console.log(`Puerto: ${process.env.SMTP_PORT}`);
console.log(`Usuario: ${process.env.SMTP_USER}`);
console.log(`Contraseña: ****** (ocultada por seguridad)`);

// Función para probar el email
async function testEmail() {
  try {
    // Crear transportador de correo
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === '465', // true para puerto 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    // Verificar la configuración
    console.log('\nVerificando configuración del servidor de correo...');
    await transporter.verify();
    console.log('✅ Configuración verificada correctamente');

    // Enviar correo de prueba
    console.log('\nEnviando correo de prueba...');
    const info = await transporter.sendMail({
      from: `"Sistema de Herramientas" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Enviar a tu propio correo
      subject: 'Prueba de Configuración ✔',
      text: 'Si estás recibiendo este correo, la configuración de email funciona correctamente.',
      html: '<b>Si estás recibiendo este correo, la configuración de email funciona correctamente.</b>'
    });

    console.log('✅ Correo enviado correctamente');
    console.log(`ID del mensaje: ${info.messageId}`);
    console.log(`Vista previa: ${nodemailer.getTestMessageUrl(info)}`);
    console.log('\nRevisa tu bandeja de entrada para confirmar la recepción.');
    
  } catch (error) {
    console.error('❌ Error en la configuración de email:');
    console.error(error);
    
    // Sugerencias específicas para errores comunes
    if (error.code === 'EAUTH') {
      console.log('\n--- SUGERENCIAS PARA ERROR DE AUTENTICACIÓN ---');
      console.log('1. Si estás usando Gmail:');
      console.log('   - Asegúrate de tener la verificación en dos pasos activada');
      console.log('   - Usa una "Contraseña de aplicación" en lugar de tu contraseña regular');
      console.log('   - Genera una en: https://myaccount.google.com/apppasswords');
      console.log('2. Verifica que tu email y contraseña sean correctos');
    } else if (error.code === 'ESOCKET') {
      console.log('\n--- SUGERENCIAS PARA ERROR DE CONEXIÓN ---');
      console.log('1. Verifica que los valores de SMTP_HOST y SMTP_PORT sean correctos');
      console.log('2. Asegúrate de que tu red no bloquee la conexión SMTP');
    }
  }
  
  process.exit(0);
}

// Ejecutar la prueba
testEmail();