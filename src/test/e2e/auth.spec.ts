import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to login page', async ({ page }) => {
    await page.click('[data-testid="login-link"]');
    
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h1')).toContainText('Iniciar Sesión');
  });

  test('should navigate to register page', async ({ page }) => {
    await page.click('[data-testid="register-link"]');
    
    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator('h1')).toContainText('Registrarse');
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/login');
    
    // Intentar login sin datos
    await page.click('[data-testid="login-button"]');
    
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
  });

  test('should show validation errors for invalid registration', async ({ page }) => {
    await page.goto('/register');
    
    // Intentar registro con datos inválidos
    await page.fill('[data-testid="name-input"]', '');
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', 'weak');
    
    await page.click('[data-testid="register-button"]');
    
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
  });

  test('should successfully register new user', async ({ page }) => {
    await page.goto('/register');
    
    const testEmail = `test-${Date.now()}@example.com`;
    
    await page.fill('[data-testid="name-input"]', 'Test User');
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'TestPass123!');
    
    await page.click('[data-testid="register-button"]');
    
    // Esperar a que se complete el registro
    await page.waitForURL(/.*dashboard/);
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Test User');
  });

  test('should successfully login existing user', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    
    await page.click('[data-testid="login-button"]');
    
    // Esperar a que se complete el login
    await page.waitForURL(/.*dashboard/);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Usar estado de autenticación guardado
    await page.goto('/');
    await page.context().addCookies([
      {
        name: 'auth-token',
        value: 'test-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    await page.goto('/dashboard');
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="login-link"]')).toBeVisible();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show password strength indicator', async ({ page }) => {
    await page.goto('/register');
    
    const passwordInput = page.locator('[data-testid="password-input"]');
    
    // Contraseña débil
    await passwordInput.fill('weak');
    await expect(page.locator('[data-testid="password-strength"]')).toHaveClass(/weak/);
    
    // Contraseña fuerte
    await passwordInput.fill('StrongPass123!');
    await expect(page.locator('[data-testid="password-strength"]')).toHaveClass(/strong/);
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('[data-testid="password-input"]');
    const toggleButton = page.locator('[data-testid="password-toggle"]');
    
    await passwordInput.fill('testpassword');
    
    // Inicialmente oculto
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Mostrar contraseña
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Ocultar contraseña
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
