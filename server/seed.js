const db = require('./config/db');

async function seed() {
  console.log('🌱 Seed initialization script running for NOVA Platform...');
  const data = db.getDataStore();
  db.saveStore();
  console.log(' Ready with 4 demo accounts (admin@nova.io, alex@nova.io, sarah@nova.io, david@nova.io)');
  console.log(' Active projects: ', data.projects.length);
  console.log(' Active tasks: ', data.tasks.length);
  process.exit(0);
}

seed();
