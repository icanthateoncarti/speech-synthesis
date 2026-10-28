import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sealSession, unsealSession, parseSharedFragment, bounded } from '../../src/share-crypto.js';
import { layoutItems } from '../../src/pdf-layout.js';
import { encodeWav, concatWavBlobs, sliceWavBlob, parseWav } from '../../src/audio.js';
import { encodeWavBlob } from '../../src/mp3-stream.js';
import { limitedBody } from '../../services/sharing/worker.js';
import lame from '@breezystack/lamejs';
const course = { version: 1, text: 'Chapitre 1\nBonjour <img src=x onerror=alert(1)>.', voice: 'tom', speed: 1.2, name: 'École', offset: 15, chapters: [{ title: 'Chapitre 1', offset: 0 }] };
test('partage : aller-retour chiffré, mauvais lien et altération refusés', async () => {
  const sealed = await sealSession(course), body = await sealed.body.arrayBuffer();
  const result = await unsealSession(body, sealed.key);
  assert.equal(result.text, course.text); assert.equal(result.offset, 15); assert.equal(result.speed, 1.2);
  assert.ok(!new TextDecoder().decode(body).includes('Chapitre'));
  const broken = new Uint8Array(body); broken[20] ^= 1;
  await assert.rejects(unsealSession(broken.buffer, sealed.key));
  assert.throws(() => parseSharedFragment('#session=x.y'));
  await assert.rejects(sealSession({ ...course, speed: Infinity }));
  await assert.rejects(sealSession({ ...course, chapters: [{title:'x',offset:-1}] }));
  await assert.rejects(bounded(new Blob([new Uint8Array(1000)]).stream(), 999));
});
test('limite serveur appliquée au flux même sans Content-Length', async () => {
  const request = size => new Request('http://local', { method: 'POST', body: new Blob([new Uint8Array(size)]) });
  assert.equal((await limitedBody(request(40))).length, 40);
  await assert.rejects(limitedBody(request(512 * 1024 + 1)));
});
test('colonnes et tableaux conservent chaque élément et leur provenance', () => {
  const item = (str,x,y,width=40) => ({str,transform:[1,0,0,1,x,y],width,height:10});
  const items = [item('gauche haut',0,200),item('droite haut',200,200),item('gauche bas',0,180),item('droite bas',200,180)];
  assert.deepEqual(layoutItems(items,'columns').map(x=>x.str), ['gauche haut','gauche bas','droite haut','droite bas']);
  assert.deepEqual(new Set(layoutItems(items,'columns').map(x=>x.original)),new Set(items));
  assert.deepEqual(layoutItems(items,'rows').map(x=>x.str), ['gauche haut ; ','droite haut\n','gauche bas ; ','droite bas\n']);
});
test('WAV en blobs : silences et découpage sans perte de PCM', async () => {
  const a = encodeWav(new Int16Array(22050).fill(42),22050);
  const blob = concatWavBlobs([new Blob([a]), new Blob([a])],22050);
  const parsed = parseWav(await blob.arrayBuffer());
  const parts = await sliceWavBlob(blob, 0.5);
  const samples = [];
  for (const part of parts) samples.push(...parseWav(await part.blob.arrayBuffer()).samples);
  assert.deepEqual(new Int16Array(samples), parsed.samples);
  assert.ok(Math.abs(parts.at(-1).end - parsed.samples.length/22050)<1e-6);
});
test('encodage MP3 par flux identique à l’encodage PCM direct', async () => {
  const pcm = Int16Array.from({length: 44105}, (_,i)=>Math.round(5000*Math.sin(i/20)));
  const encoder = new lame.Mp3Encoder(1,22050,96), chunks=[];
  for(let i=0;i<pcm.length;i+=1152) chunks.push(new Uint8Array(encoder.encodeBuffer(pcm.subarray(i,i+1152))));
  chunks.push(new Uint8Array(encoder.flush()));
  const streamed = await encodeWavBlob(new Blob([encodeWav(pcm,22050)]),lame.Mp3Encoder);
  assert.deepEqual(new Uint8Array(await streamed.arrayBuffer()), new Uint8Array(await new Blob(chunks).arrayBuffer()));
});
