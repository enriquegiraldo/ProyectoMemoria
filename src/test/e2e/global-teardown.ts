import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Limpiar datos de prueba si es necesario
    console.log('Limpiando datos de prueba...');

    // Aquí podrías agregar lógica para limpiar datos de prueba
    // Por ejemplo, eliminar usuarios de prueba, memorias de prueba, etc.

    // Limpiar archivos de autenticación
    const authPath = path.join(process.cwd(), 'playwright', '.auth', 'user.json');
    if (fs.existsSync(authPath)) {
      fs.unlinkSync(authPath);
    }

    console.log('Limpieza completada');

  } catch (error) {
    console.log('Error en teardown global:', error);
  }

  await browser.close();
}

export default globalTeardown;
