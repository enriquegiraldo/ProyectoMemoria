import { test, expect } from '@playwright/test';

test.describe('Memories', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display memories gallery', async ({ page }) => {
    await expect(page.locator('[data-testid="memories-gallery"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-memory-button"]')).toBeVisible();
  });

  test('should open upload modal when add memory button is clicked', async ({ page }) => {
    await page.click('[data-testid="add-memory-button"]');
    
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-title"]')).toContainText('Agregar Memoria');
  });

  test('should upload image memory successfully', async ({ page }) => {
    await page.click('[data-testid="add-memory-button"]');
    
    // Crear archivo de prueba
    const filePath = 'test-assets/test-image.jpg';
    
    await page.setInputFiles('[data-testid="file-input"]', filePath);
    await page.fill('[data-testid="memory-title"]', 'Test Memory');
    await page.fill('[data-testid="memory-description"]', 'This is a test memory');
    await page.fill('[data-testid="memory-tags"]', 'test, memory');
    
    await page.click('[data-testid="upload-submit"]');
    
    // Esperar a que se complete la subida
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-modal"]')).not.toBeVisible();
  });

  test('should show validation errors for invalid upload', async ({ page }) => {
    await page.click('[data-testid="add-memory-button"]');
    
    // Intentar subir sin archivo
    await page.click('[data-testid="upload-submit"]');
    
    await expect(page.locator('[data-testid="file-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="title-error"]')).toBeVisible();
  });

  test('should search memories', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    
    await searchInput.fill('test memory');
    await searchInput.press('Enter');
    
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('should filter memories by media type', async ({ page }) => {
    await page.click('[data-testid="filter-button"]');
    
    await page.click('[data-testid="filter-images"]');
    await page.click('[data-testid="apply-filters"]');
    
    await expect(page.locator('[data-testid="filtered-results"]')).toBeVisible();
  });

  test('should like a memory', async ({ page }) => {
    const likeButton = page.locator('[data-testid="like-button"]').first();
    const likeCount = page.locator('[data-testid="like-count"]').first();
    
    const initialCount = await likeCount.textContent();
    
    await likeButton.click();
    
    await expect(likeCount).not.toContainText(initialCount);
  });

  test('should add comment to memory', async ({ page }) => {
    const commentInput = page.locator('[data-testid="comment-input"]').first();
    const commentButton = page.locator('[data-testid="comment-button"]').first();
    
    await commentInput.fill('This is a test comment');
    await commentButton.click();
    
    await expect(page.locator('[data-testid="comment-list"]')).toContainText('This is a test comment');
  });

  test('should edit memory', async ({ page }) => {
    const editButton = page.locator('[data-testid="edit-memory-button"]').first();
    
    await editButton.click();
    
    await expect(page.locator('[data-testid="edit-modal"]')).toBeVisible();
    
    await page.fill('[data-testid="edit-title"]', 'Updated Memory Title');
    await page.click('[data-testid="save-edit"]');
    
    await expect(page.locator('[data-testid="memory-title"]')).toContainText('Updated Memory Title');
  });

  test('should delete memory', async ({ page }) => {
    const deleteButton = page.locator('[data-testid="delete-memory-button"]').first();
    
    await deleteButton.click();
    
    // Confirmar eliminación
    await page.click('[data-testid="confirm-delete"]');
    
    await expect(page.locator('[data-testid="delete-success"]')).toBeVisible();
  });

  test('should share memory', async ({ page }) => {
    const shareButton = page.locator('[data-testid="share-button"]').first();
    
    await shareButton.click();
    
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="share-link"]')).toBeVisible();
  });

  test('should generate QR code for memory', async ({ page }) => {
    const qrButton = page.locator('[data-testid="qr-button"]').first();
    
    await qrButton.click();
    
    await expect(page.locator('[data-testid="qr-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
  });

  test('should view memory details', async ({ page }) => {
    const memoryCard = page.locator('[data-testid="memory-card"]').first();
    
    await memoryCard.click();
    
    await expect(page.locator('[data-testid="memory-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="memory-media"]')).toBeVisible();
  });

  test('should navigate through memory gallery', async ({ page }) => {
    const nextButton = page.locator('[data-testid="next-memory"]');
    const prevButton = page.locator('[data-testid="prev-memory"]');
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await expect(page.locator('[data-testid="memory-card"]')).toBeVisible();
    }
    
    if (await prevButton.isVisible()) {
      await prevButton.click();
      await expect(page.locator('[data-testid="memory-card"]')).toBeVisible();
    }
  });

  test('should handle infinite scroll', async ({ page }) => {
    // Scroll hasta el final de la página
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Esperar a que se carguen más memorias
    await page.waitForTimeout(2000);
    
    await expect(page.locator('[data-testid="memory-card"]')).toHaveCount({ min: 1 });
  });

  test('should handle offline mode', async ({ page }) => {
    // Simular modo offline
    await page.route('**/*', route => route.abort());
    
    await page.reload();
    
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
  });

  test('should handle upload progress', async ({ page }) => {
    await page.click('[data-testid="add-memory-button"]');
    
    const filePath = 'test-assets/large-image.jpg';
    await page.setInputFiles('[data-testid="file-input"]', filePath);
    
    await page.fill('[data-testid="memory-title"]', 'Large Memory');
    await page.fill('[data-testid="memory-description"]', 'Large file upload test');
    
    await page.click('[data-testid="upload-submit"]');
    
    // Verificar que se muestra el progreso
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
  });

  test('should handle upload errors', async ({ page }) => {
    await page.click('[data-testid="add-memory-button"]');
    
    // Simular error de red
    await page.route('**/upload', route => route.abort());
    
    const filePath = 'test-assets/test-image.jpg';
    await page.setInputFiles('[data-testid="file-input"]', filePath);
    await page.fill('[data-testid="memory-title"]', 'Error Test');
    
    await page.click('[data-testid="upload-submit"]');
    
    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
  });
});
