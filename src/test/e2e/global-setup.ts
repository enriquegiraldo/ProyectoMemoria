import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Configurar datos de prueba globales
  await page.goto('http://localhost:3000');

  // Crear usuario de prueba si no existe
  try {
    // Verificar si ya existe un usuario de prueba
    await page.goto('http://localhost:3000/login');
    
    // Intentar login con usuario de prueba
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-button"]');

    // Esperar a que se complete el login o redirija a registro
    await page.waitForTimeout(2000);

    // Si no está logueado, crear cuenta de prueba
    if (page.url().includes('/login') || page.url().includes('/register')) {
      await page.goto('http://localhost:3000/register');
      
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPass123!');
      await page.fill('[data-testid="confirm-password-input"]', 'TestPass123!');
      
      await page.click('[data-testid="register-button"]');
      
      // Esperar a que se complete el registro
      await page.waitForTimeout(3000);
    }

    // Guardar estado de autenticación
    await page.context().storageState({ path: 'playwright/.auth/user.json' });

  } catch (error) {
    console.log('Error en setup global:', error);
    // Continuar sin autenticación si hay errores
  }

  await browser.close();
}

export default globalSetup;
