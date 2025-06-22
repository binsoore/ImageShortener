#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Building static version for CloudFlare Pages...');

// Build the Vite project
console.log('Building Vite project...');
execSync('npm run build:static', { stdio: 'inherit' });

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy _redirects file to dist
const redirectsSource = path.join(__dirname, '_redirects');
const redirectsTarget = path.join(distDir, '_redirects');

if (fs.existsSync(redirectsSource)) {
  fs.copyFileSync(redirectsSource, redirectsTarget);
  console.log('Copied _redirects to dist/');
}

console.log('Static build complete!');
console.log('Deploy the dist/ directory to CloudFlare Pages');
console.log('Make sure to set up KV namespace binding: IMAGE_STORE');