import fs from 'node:fs'
import Fastify from 'fastify'

const words = await getWords()
console.log(`Loaded ${words.length} words.`)

const fastify = Fastify({
  logger: true
})

fastify.get('/word', async function handler (request, reply) {
  return {
    word: words[Math.floor(Math.random() * words.length)]
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

  return {
    word: word,
    color: color,
  }
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
      console.log('Nounlist is not in cache, downloading ...')
      const res = await fetch('https://www.desiquintans.com/downloads/nounlist/nounlist.txt')
      const data = await res.text()

      fs.writeFileSync('./cache/nounlist.txt', data)

      return data
    }

    throw e
  }
}
