import fs from 'node:fs'
import Fastify from 'fastify'

import { load as loadConfig } from './config.js'
import * as database from './database.js'

const config = loadConfig()

const fastify = Fastify({
  // see https://fastify.dev/docs/latest/Reference/Logging/
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
})

const words = await getWords()
fastify.log.info(`Loaded ${words.length} words.`)

const dbConnection = await database.createConnection(config)
fastify.log.info(`Successfully connected to MySQL database.`)

fastify.get('/word', async function handler (request, reply) {
  const [rows, _] = await dbConnection.execute(`
    SELECT DISTINCT word
    FROM guess
    WHERE color IS NOT NULL AND amount > 0
  `)

  // probability to choose a random word among all nouns,
  // compared to choose word that has already a guess
  let explorationRate = 0.5
  if (request.query.knownWordCount !== undefined) {
    const knownWordCountStr = request.query.knownWordCount
    if (typeof knownWordCountStr !== 'string' || !knownWordCountStr.match(/^[0-9]+$/)) {
      reply.status(400)
      return { error: 'Parameter "knownWordCountStr" is malformed' }
    }

    const knownWordCount = parseInt(request.query.knownWordCount)

    // if knownWordCount === 0: never explore new words
    // if knownWordCount === 1: always explore new words
    explorationRate = knownWordCount / rows.length
  }

  if (rows.length === 0 || Math.random() < explorationRate) {
    return {
      word: words[Math.floor(Math.random() * words.length)]
    }
  }

  const row = rows[Math.floor(Math.random() * rows.length)]

  return {
    word: row.word
  }
})

fastify.post('/guess', async function handler(request, reply) {
  const word = request.query.word;
  if (typeof word !== 'string') {
    reply.status(400)
    return { error: 'Parameter "word" is missing or malformed' }
  }

  const color = request.query.color;
  if (typeof color !== 'string' || !color.match(/^#[0-9a-f]{6}$/)) {
    reply.status(400)
    return { error: 'Parameter "color" is missing or malformed' }
  }

  await dbConnection.execute(`
    INSERT INTO
    guess(word, color, amount)
    VALUES(?, ?, 1)
    ON DUPLICATE KEY UPDATE amount = amount + 1
  `, [word, color])

  return {
    word: word,
    color: color,
  }
})

fastify.get('/guesses', async function handler(request, reply) {
  const word = request.query.word;
  if (typeof word !== 'string') {
    reply.status(400)
    return { error: 'Parameter "word" is missing or malformed' }
  }

  const [rows, _] = await dbConnection.execute(`
    SELECT color, amount
    FROM guess
    WHERE word = ?
  `, [word])

  return rows
})

// Run the server!
try {
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}

async function getWords() {
  const data = await getNounlistData()
  return data.trim().split('\n')
}

async function getNounlistData() {
  fs.mkdirSync('./cache', { recursive: true })

  try {
    const fileContent = fs.readFileSync('./cache/nounlist.txt', { encoding: 'utf-8' })
    return fileContent
  } catch (e) {
    if (e instanceof Error && e.code === 'ENOENT') {
      fastify.log.info('Nounlist is not in cache, downloading ...')
      const res = await fetch('https://www.desiquintans.com/downloads/nounlist/nounlist.txt')
      const data = await res.text()

      fs.writeFileSync('./cache/nounlist.txt', data)

      return data
    }

    throw e
  }
}
