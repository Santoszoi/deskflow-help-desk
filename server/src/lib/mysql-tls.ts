import fs from 'node:fs';

export function mysqlTlsOptions(env: NodeJS.ProcessEnv = process.env) {
  const enabled = env.DB_SSL;
  if (enabled !== undefined && !['true', 'false'].includes(enabled)) {
    throw new Error('DB_SSL must be true or false');
  }
  if (enabled !== 'true') {
    if (env.DB_SSL_CA || env.DB_SSL_CA_PATH) throw new Error('Set DB_SSL=true when supplying a CA certificate');
    return undefined;
  }
  if (env.DB_SSL_CA && env.DB_SSL_CA_PATH) throw new Error('Supply only one MySQL CA source');
  const ca = env.DB_SSL_CA || (env.DB_SSL_CA_PATH ? fs.readFileSync(env.DB_SSL_CA_PATH, 'utf8') : undefined);
  if (ca && !ca.includes('-----BEGIN CERTIFICATE-----')) throw new Error('Invalid MySQL CA certificate');
  return { rejectUnauthorized: true, ...(ca ? { ca } : {}) };
}
