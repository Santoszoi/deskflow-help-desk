import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mysqlTlsOptions} from '../server/dist/lib/mysql-tls.js';

test('hosted MySQL verifies certificates and rejects unsafe or ambiguous configuration', () => {
  assert.equal(mysqlTlsOptions({}), undefined);
  assert.deepEqual(mysqlTlsOptions({DB_SSL:'true'}), {rejectUnauthorized:true});
  const ca='-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----';
  assert.deepEqual(mysqlTlsOptions({DB_SSL:'true',DB_SSL_CA:ca}), {rejectUnauthorized:true,ca});
  assert.throws(()=>mysqlTlsOptions({DB_SSL:'invalid'}));
  assert.throws(()=>mysqlTlsOptions({DB_SSL:'false',DB_SSL_CA:ca}));
  assert.throws(()=>mysqlTlsOptions({DB_SSL:'true',DB_SSL_CA:'invalid'}));
  assert.throws(()=>mysqlTlsOptions({DB_SSL:'true',DB_SSL_CA:ca,DB_SSL_CA_PATH:'other.pem'}));
  assert.throws(()=>mysqlTlsOptions({DB_SSL:'true',DB_SSL_CA_PATH:'/missing/mysql-ca.pem'}));
});
