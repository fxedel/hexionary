// Import the framework and instantiate it
import Fastify from 'fastify'
const fastify = Fastify({
  logger: true
})

fastify.get('/word', async function handler (request, reply) {
  return {
    word: 'world'
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