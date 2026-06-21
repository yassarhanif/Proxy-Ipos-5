const { Service } = require('node-windows');
const path = require('path');

const svc = new Service({
  name: 'DBProxyIPOS5',
  description: 'Proxy PostgreSQL read-only API untuk IPOS 5',
  script: path.join(__dirname, '..', 'src', 'index.js'),
  wait: 2,
  grow: 0.5,
  maxRestarts: 3,
});

svc.on('install', () => {
  console.log('Service installed successfully');
  svc.start();
});

svc.on('start', () => {
  console.log('Service started successfully');
  console.log('Access at http://localhost:3001');
  process.exit(0);
});

svc.on('alreadyinstalled', () => {
  console.log('Service already installed');
  process.exit(0);
});

svc.on('error', (err) => {
  console.error('Error:', err);
  process.exit(1);
});

console.log('Installing DB Proxy IPOS 5 as Windows service...');
svc.install();
