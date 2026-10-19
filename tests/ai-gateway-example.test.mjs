import assert from 'node:assert/strict'
import test from 'node:test'
import { generateHoliday } from '../index.ts'

test('generates a holiday using the requested AI Gateway model and prompt', async () => {
  let options

  const text = await generateHoliday(async (requestOptions) => {
    options = requestOptions
    return { text: 'Lantern Day is celebrated with handmade lights.' }
  })

  assert.equal(options.model, 'moonshotai/kimi-k3')
  assert.equal(options.prompt, 'Invent a new holiday and describe its traditions.')
  assert.equal(text, 'Lantern Day is celebrated with handmade lights.')
})

test('rejects an empty model response', async () => {
  await assert.rejects(
    generateHoliday(async () => ({ text: '  \n' })),
    { message: 'The model returned an empty response.' },
  )
})

test('propagates generation failures to the caller', async () => {
  const failure = new Error('Gateway unavailable')

  await assert.rejects(
    generateHoliday(async () => {
      throw failure
    }),
    (error) => error === failure,
  )
})
