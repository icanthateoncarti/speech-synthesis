import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agentTools, registerAgentTools } from '../../src/agent-tools.js';

function machine() {
  const log = [], els = {};
  const el = (id) => els[id] ??= {
    id, value: '',
    click: () => log.push(`clic ${id}`),
    dispatchEvent: (event) => log.push(`${event.type} ${id}=${els[id].value}`),
  };
  return { $: el, log };
}

test('agents : lire un texte passe par l’écran, la voix, la vitesse puis PARLE', async () => {
  const { $, log } = machine();
  const read = agentTools($).find((t) => t.name === 'lire-a-voix-haute');
  const result = await read.execute({ texte: 'Bonjour à tous', voix: 'tom', vitesse: 1.27 });
  assert.deepEqual(log, ['input screen=Bonjour à tous', 'clic voice-tom', 'input speed=1.3', 'clic key-speak']);
  assert.match(result.content[0].text, /3 mots/);
});

test('agents : export MP3, vitesse bornée, voix inconnue ignorée, texte vide refusé', async () => {
  const { $, log } = machine();
  const mp3 = agentTools($).find((t) => t.name === 'exporter-mp3');
  await mp3.execute({ texte: 'Salut', voix: 'robot', vitesse: 9 });
  assert.deepEqual(log, ['input screen=Salut', 'input speed=1.5', 'clic key-mp3']);
  await assert.rejects(mp3.execute({ texte: '   ' }), /texte vide/);
});

test('agents : outils déclarés seulement si le navigateur offre WebMCP', () => {
  const { $ } = machine();
  assert.equal(registerAgentTools($, undefined), 0);
  const names = [];
  assert.equal(registerAgentTools($, { registerTool: (tool) => { names.push(tool.name); } }), 2);
  assert.deepEqual(names, ['lire-a-voix-haute', 'exporter-mp3']);
  for (const tool of agentTools($)) assert.deepEqual(tool.inputSchema.required, ['texte']);
});
