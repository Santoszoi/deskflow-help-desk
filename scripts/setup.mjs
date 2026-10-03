import {randomBytes} from 'node:crypto';
import {writeFileSync,existsSync} from 'node:fs';
const secret=()=>randomBytes(32).toString('hex');
if(!existsSync('.env'))writeFileSync('.env',`JWT_SECRET=${secret()}\nDB_PASSWORD=${secret()}\nMYSQL_ROOT_PASSWORD=${secret()}\nDEMO_SEED=true\n`,{mode:0o600});
if(!existsSync('server/.env'))writeFileSync('server/.env',`PORT=3333\nJWT_SECRET=${secret()}\nDB_CLIENT=sqlite\nDEMO_SEED=true\n`,{mode:0o600});
console.log('Local environment files are ready. Demo accounts are enabled. Set DEMO_SEED=false for real deployments.');
