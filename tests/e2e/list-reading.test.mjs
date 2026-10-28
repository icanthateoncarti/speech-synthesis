import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { startServer, launch, ROOT } from './harness.mjs';

test('liste de produits : voix anglaise réelle, silences, cache et MP3', {timeout:180000}, async () => {
  const server = await startServer();
  const {browser, page} = await launch({profile:ROOT+'/tests/e2e/.chrome-profile/list-reading'});
  try {
    await page.goto(server.url+'/tests/e2e/fixtures/tts.html');
    await page.waitForFunction(() => window.ttsReady);
    const result = await page.evaluate(async () => {
      const {parseWav, wavToMp3, wavDuration} = await import('/src/audio.js');
      const input = {text:'The products are available in three flavors • Orange • Orange C-Power • Orange–Mango',voice:'jessica',speed:1};
      const streamed=[];
      const audio = await window.tts.synthesize(input, {onChunk(wav,i,total,pause) {
        const {samples,sampleRate} = parseWav(wav);
        streamed.push({i,pause,seconds:wavDuration(wav),silentLead:[...samples.slice(0,Math.floor(sampleRate*0.45))].every(n=>n===0)});
      }});
      const cached = await window.tts.synthesize(input, {blob:true});
      const cachedWav = await cached.wav.arrayBuffer();
      const a=new Uint8Array(audio.wav), b=new Uint8Array(cachedWav);
      const mp3=await wavToMp3(cachedWav);
      const blob=mp3 instanceof Blob ? mp3 : new Blob([mp3],{type:'audio/mpeg'});
      const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';
      for(let i=0;i<bytes.length;i+=8192) binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
      return {lang:audio.lang,chunks:audio.chunks,streamed,identical:a.length===b.length && a.every((v,i)=>v===b[i]),mp3Bytes:bytes.length,base64:btoa(binary)};
    });
    assert.equal(result.lang,'en'); assert.equal(result.chunks.length,4);
    assert.equal(result.identical,true);
    for(const item of result.streamed.slice(1)) {assert.equal(item.pause.before,0.45); assert.equal(item.silentLead,true); assert.ok(item.seconds>0.45);}
    assert.ok(result.mp3Bytes>10000);
    await mkdir(ROOT+'/logs/list-reading',{recursive:true});
    await writeFile(ROOT+'/logs/list-reading/products.mp3',Buffer.from(result.base64,'base64'));
    console.log({chunks:result.chunks,streamed:result.streamed,mp3Bytes:result.mp3Bytes});
  } finally {await browser.close();await server.close();}
});
