import mysql from 'mysql2/promise'
import path from 'node:path'
import Postgrator from "postgrator";

export async function createConnection(config) {
  const mysqlConnection = await mysql.createConnection({
    host: config.mysql.host,
    port: config.mysql.port,
    database: config.mysql.database,
    user: config.mysql.user,
    password: config.mysql.password,
    multipleStatements: true,
  })

  await mysqlConnection.ping()

  const postgrator = new Postgrator({
    migrationPattern: path.join('schema', 'migrations', '*'),
    driver: 'mysql',
    database: config.mysql.database,
    schemaTable: 'schemaversion',
    validateChecksums: false,
    execQuery: async (query) => {
      const [rows, fields] = await mysqlConnection.query(query)
      return {
        rows: rows,
        fields: fields,
      }
    },
  })

  const appliedMigrations = await postgrator.migrate(config.mysql.version)

  for (const appliedMigration of appliedMigrations) {
    console.log(`Applied database migration:`, appliedMigration)
  }

  return mysqlConnection
}
