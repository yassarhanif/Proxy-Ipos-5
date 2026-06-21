const { Service } = require('node-windows');
const path = require('path');

const svc = new Service({
  name: 'DBProxyIPOS5',
  script: path.join(__dirname, '..', 'src', 'index.js'),
});

svc.on('uninstall', () => {
  console.log('Service uninstalled successfully');
  process.exit(0);
});

svc.on('alreadyuninstalled', () => {
  console.log('Service already uninstalled');
  process.exit(0);
});

svc.on('error', (err) => {
  console.error('Error:', err);
  process.exit(1);
});

console.log('Uninstalling DB Proxy IPOS 5 Windows service...');
svc.uninstall();
