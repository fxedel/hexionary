import dotenv from 'dotenv'
import fs from 'node:fs'

export function load() {
  initDotEnv()

  const dotenvConfigOutput = dotenv.config()

  if (dotenvConfigOutput.error) {
    throw dotenvConfigOutput.error
  }

  return {
    mysql: {
      version: 'max',
      host: getEnvOrFail('MYSQL_HOST'),
      port: getEnvOrFail('MYSQL_PORT'),
      database: getEnvOrFail('MYSQL_DATABASE'),
      user: getEnvOrFail('MYSQL_USER'),
      password: getEnvOrFail('MYSQL_PASSWORD'),
    }
  }  
}

function getEnvOrFail(key) {
  const val = process.env[key]
  if (val === undefined || val === '') {
    throw Error(`Missing .env variable ${key}`)
  }

  return val
}

function initDotEnv() {
  if (!fs.existsSync('.env')) {
    console.log('.env file does not exist, copying .env.dist')
    fs.copyFileSync('.env.dist', '.env', fs.constants.COPYFILE_EXCL)
  }
}
