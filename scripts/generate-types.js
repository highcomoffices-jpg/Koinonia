import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

try {
  console.log('🔄 Génération des types TypeScript depuis Supabase...');
  
  // Commande pour générer les types
  const command = `npx supabase gen types typescript --project-id vsuzocbkolhnzcoxdhji --schema public > ${join(projectRoot, 'src/lib/database.types.ts')}`;
  
  execSync(command, { stdio: 'inherit', cwd: projectRoot });
  
  console.log('✅ Types générés avec succès !');
  console.log(`📁 Fichier: ${join(projectRoot, 'src/lib/database.types.ts')}`);
} catch (error) {
  console.error('❌ Erreur lors de la génération des types:', error.message);
  process.exit(1);
}