import {cpSync,existsSync} from 'node:fs';
if(!existsSync('.next/standalone/server.js'))throw new Error('Run npm run build before npm start.');
cpSync('.next/static','.next/standalone/.next/static',{recursive:true});
if(existsSync('public'))cpSync('public','.next/standalone/public',{recursive:true});
process.env.HOSTNAME='0.0.0.0';
process.env.PORT ||= '3000';
await import('../.next/standalone/server.js');
