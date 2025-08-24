#!/usr/bin/env node

/**
 * Script para generar assets de PWA
 * Genera iconos en diferentes tamaños para la aplicación PWA
 */

const fs = require('fs');
const path = require('path');

// Configuración de iconos a generar
const ICON_SIZES = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' }
];

// Configuración del manifest
const MANIFEST_CONFIG = {
  name: 'Memoria Eterna',
  short_name: 'MemoriaEterna',
  description: 'Plataforma para preservar y compartir recuerdos de seres queridos',
  theme_color: '#3B82F6',
  background_color: '#FFFFFF',
  display: 'standalone',
  orientation: 'portrait',
  scope: '/',
  start_url: '/',
  icons: [
    {
      src: '/pwa-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any maskable'
    },
    {
      src: '/pwa-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable'
    },
    {
      src: '/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png'
    }
  ],
  categories: ['lifestyle', 'social', 'utilities'],
  lang: 'es',
  dir: 'ltr',
  prefer_related_applications: false,
  related_applications: []
};

// Función para crear directorio si no existe
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Directorio creado: ${dirPath}`);
  }
}

// Función para generar un icono SVG básico (placeholder)
function generateSVGIcon(size, text = 'ME') {
  const fontSize = Math.floor(size * 0.4);
  const textY = Math.floor(size * 0.6);
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1D4ED8;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
    <text x="50%" y="${textY}" font-family="Arial, sans-serif" font-size="${fontSize}" 
          font-weight="bold" text-anchor="middle" fill="white">${text}</text>
  </svg>`;
}

// Función para generar iconos
function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public');
  ensureDirectoryExists(publicDir);

  console.log('🎨 Generando iconos de PWA...');

  ICON_SIZES.forEach(({ size, name }) => {
    const svgContent = generateSVGIcon(size);
    const iconPath = path.join(publicDir, name);
    
    // Para este ejemplo, guardamos como SVG
    // En producción, usarías una librería como sharp para convertir a PNG
    fs.writeFileSync(iconPath.replace('.png', '.svg'), svgContent);
    console.log(`✅ Icono generado: ${name.replace('.png', '.svg')} (${size}x${size})`);
  });

  console.log('✅ Todos los iconos han sido generados');
}

// Función para actualizar el manifest
function updateManifest() {
  const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
  
  fs.writeFileSync(manifestPath, JSON.stringify(MANIFEST_CONFIG, null, 2));
  console.log('✅ Manifest actualizado');
}

// Función para crear archivo robots.txt
function createRobotsTxt() {
  const robotsContent = `User-agent: *
Allow: /

Sitemap: https://tu-dominio.com/sitemap.xml

# PWA
Allow: /manifest.json
Allow: /sw.js
Allow: /workbox-*.js`;
  
  const robotsPath = path.join(__dirname, '..', 'public', 'robots.txt');
  fs.writeFileSync(robotsPath, robotsContent);
  console.log('✅ robots.txt creado');
}

// Función para crear archivo sitemap básico
function createSitemap() {
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://tu-dominio.com/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://tu-dominio.com/login</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://tu-dominio.com/register</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
  
  const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapContent);
  console.log('✅ sitemap.xml creado');
}

// Función principal
function main() {
  console.log('🚀 Iniciando generación de assets de PWA...\n');
  
  try {
    generateIcons();
    updateManifest();
    createRobotsTxt();
    createSitemap();
    
    console.log('\n🎉 ¡Assets de PWA generados exitosamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('1. Reemplaza los iconos SVG con PNG reales usando una herramienta como sharp');
    console.log('2. Actualiza las URLs en sitemap.xml con tu dominio real');
    console.log('3. Añade screenshots reales de tu aplicación');
    console.log('4. Prueba la instalación de PWA en diferentes dispositivos');
    
  } catch (error) {
    console.error('❌ Error generando assets:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  generateIcons,
  updateManifest,
  createRobotsTxt,
  createSitemap
};
