// Révision figée du dépôt de voix (et non la branche mutable « main ») ; chaque
// fichier des voix du site est vérifié par son empreinte avant usage (audit S07).
const VOICE_REVISION = "840e38a7e26d813bd6221b78cfbaefa3585b3f71";
const VOICE_SHA256 = {
  "fr_FR-upmc-medium.onnx": "9abb3800c199148897a9ed64e100d224f3de83579f100044174ad19418f1786f",
  "fr_FR-upmc-medium.onnx.json": "e8636ec15dfd5d72db37a02cb5320a20f2b8d339f2a0e4337da64c58a33a5868",
  "fr_FR-tom-medium.onnx": "bf65074ccdeeeeaa832e75edb1c0a513c01c9a972bdf085ff8a6e71ea234fd41",
  "fr_FR-tom-medium.onnx.json": "2f7f885ad5a0aad802e3cc24e4f57239febdcb142b4876de5d238094674361cc",
  "en_US-kristin-medium.onnx": "5849957f929cbf720c258f8458692d6103fff2f0e3d3b19c8259474bb06a18d4",
  "en_US-kristin-medium.onnx.json": "5681426d4aead22195de70531eeeeddb46493cfaffc5764b2ea3db73428b651c",
  "en_US-joe-medium.onnx": "58afce0321b8d9c46d7cdf9c16500cc55a793b4220212dba6b70fb788b3baf06",
  "en_US-joe-medium.onnx.json": "3d6d5410b3795cb1950595247ef8f06190719e6fdbfa3a2356d8ec368e1aad33",
};
async function integrityOk(url, blob) {
  const expected = VOICE_SHA256[url.split("/").at(-1)];
  if (!expected) return false;
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()));
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("") === expected;
}
const u = `https://huggingface.co/diffusionstudio/piper-voices/resolve/${VOICE_REVISION}`, B = "https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.18.0/", x = "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize", c = {
  "ar_JO-kareem-low": "ar/ar_JO/kareem/low/ar_JO-kareem-low.onnx",
  "ar_JO-kareem-medium": "ar/ar_JO/kareem/medium/ar_JO-kareem-medium.onnx",
  "ca_ES-upc_ona-medium": "ca/ca_ES/upc_ona/medium/ca_ES-upc_ona-medium.onnx",
  "ca_ES-upc_ona-x_low": "ca/ca_ES/upc_ona/x_low/ca_ES-upc_ona-x_low.onnx",
  "ca_ES-upc_pau-x_low": "ca/ca_ES/upc_pau/x_low/ca_ES-upc_pau-x_low.onnx",
  "cs_CZ-jirka-low": "cs/cs_CZ/jirka/low/cs_CZ-jirka-low.onnx",
  "cs_CZ-jirka-medium": "cs/cs_CZ/jirka/medium/cs_CZ-jirka-medium.onnx",
  "da_DK-talesyntese-medium": "da/da_DK/talesyntese/medium/da_DK-talesyntese-medium.onnx",
  "de_DE-eva_k-x_low": "de/de_DE/eva_k/x_low/de_DE-eva_k-x_low.onnx",
  "de_DE-karlsson-low": "de/de_DE/karlsson/low/de_DE-karlsson-low.onnx",
  "de_DE-kerstin-low": "de/de_DE/kerstin/low/de_DE-kerstin-low.onnx",
  "de_DE-mls-medium": "de/de_DE/mls/medium/de_DE-mls-medium.onnx",
  "de_DE-pavoque-low": "de/de_DE/pavoque/low/de_DE-pavoque-low.onnx",
  "de_DE-ramona-low": "de/de_DE/ramona/low/de_DE-ramona-low.onnx",
  "de_DE-thorsten-high": "de/de_DE/thorsten/high/de_DE-thorsten-high.onnx",
  "de_DE-thorsten-low": "de/de_DE/thorsten/low/de_DE-thorsten-low.onnx",
  "de_DE-thorsten-medium": "de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx",
  "de_DE-thorsten_emotional-medium": "de/de_DE/thorsten_emotional/medium/de_DE-thorsten_emotional-medium.onnx",
  "el_GR-rapunzelina-low": "el/el_GR/rapunzelina/low/el_GR-rapunzelina-low.onnx",
  "en_GB-alan-low": "en/en_GB/alan/low/en_GB-alan-low.onnx",
  "en_GB-alan-medium": "en/en_GB/alan/medium/en_GB-alan-medium.onnx",
  "en_GB-alba-medium": "en/en_GB/alba/medium/en_GB-alba-medium.onnx",
  "en_GB-aru-medium": "en/en_GB/aru/medium/en_GB-aru-medium.onnx",
  "en_GB-cori-high": "en/en_GB/cori/high/en_GB-cori-high.onnx",
  "en_GB-cori-medium": "en/en_GB/cori/medium/en_GB-cori-medium.onnx",
  "en_GB-jenny_dioco-medium": "en/en_GB/jenny_dioco/medium/en_GB-jenny_dioco-medium.onnx",
  "en_GB-northern_english_male-medium": "en/en_GB/northern_english_male/medium/en_GB-northern_english_male-medium.onnx",
  "en_GB-semaine-medium": "en/en_GB/semaine/medium/en_GB-semaine-medium.onnx",
  "en_GB-southern_english_female-low": "en/en_GB/southern_english_female/low/en_GB-southern_english_female-low.onnx",
  "en_GB-vctk-medium": "en/en_GB/vctk/medium/en_GB-vctk-medium.onnx",
  "en_US-amy-low": "en/en_US/amy/low/en_US-amy-low.onnx",
  "en_US-amy-medium": "en/en_US/amy/medium/en_US-amy-medium.onnx",
  "en_US-arctic-medium": "en/en_US/arctic/medium/en_US-arctic-medium.onnx",
  "en_US-danny-low": "en/en_US/danny/low/en_US-danny-low.onnx",
  "en_US-hfc_female-medium": "en/en_US/hfc_female/medium/en_US-hfc_female-medium.onnx",
  "en_US-hfc_male-medium": "en/en_US/hfc_male/medium/en_US-hfc_male-medium.onnx",
  "en_US-joe-medium": "en/en_US/joe/medium/en_US-joe-medium.onnx",
  "en_US-kathleen-low": "en/en_US/kathleen/low/en_US-kathleen-low.onnx",
  "en_US-kristin-medium": "en/en_US/kristin/medium/en_US-kristin-medium.onnx",
  "en_US-kusal-medium": "en/en_US/kusal/medium/en_US-kusal-medium.onnx",
  "en_US-l2arctic-medium": "en/en_US/l2arctic/medium/en_US-l2arctic-medium.onnx",
  "en_US-lessac-high": "en/en_US/lessac/high/en_US-lessac-high.onnx",
  "en_US-lessac-low": "en/en_US/lessac/low/en_US-lessac-low.onnx",
  "en_US-lessac-medium": "en/en_US/lessac/medium/en_US-lessac-medium.onnx",
  "en_US-libritts-high": "en/en_US/libritts/high/en_US-libritts-high.onnx",
  "en_US-libritts_r-medium": "en/en_US/libritts_r/medium/en_US-libritts_r-medium.onnx",
  "en_US-ljspeech-high": "en/en_US/ljspeech/high/en_US-ljspeech-high.onnx",
  "en_US-ljspeech-medium": "en/en_US/ljspeech/medium/en_US-ljspeech-medium.onnx",
  "en_US-ryan-high": "en/en_US/ryan/high/en_US-ryan-high.onnx",
  "en_US-ryan-low": "en/en_US/ryan/low/en_US-ryan-low.onnx",
  "en_US-ryan-medium": "en/en_US/ryan/medium/en_US-ryan-medium.onnx",
  "es_ES-carlfm-x_low": "es/es_ES/carlfm/x_low/es_ES-carlfm-x_low.onnx",
  "es_ES-davefx-medium": "es/es_ES/davefx/medium/es_ES-davefx-medium.onnx",
  "es_ES-mls_10246-low": "es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx",
  "es_ES-mls_9972-low": "es/es_ES/mls_9972/low/es_ES-mls_9972-low.onnx",
  "es_ES-sharvard-medium": "es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx",
  "es_MX-ald-medium": "es/es_MX/ald/medium/es_MX-ald-medium.onnx",
  "es_MX-claude-high": "es/es_MX/claude/high/es_MX-claude-high.onnx",
  "fa_IR-amir-medium": "fa/fa_IR/amir/medium/fa_IR-amir-medium.onnx",
  "fa_IR-gyro-medium": "fa/fa_IR/gyro/medium/fa_IR-gyro-medium.onnx",
  "fi_FI-harri-low": "fi/fi_FI/harri/low/fi_FI-harri-low.onnx",
  "fi_FI-harri-medium": "fi/fi_FI/harri/medium/fi_FI-harri-medium.onnx",
  "fr_FR-gilles-low": "fr/fr_FR/gilles/low/fr_FR-gilles-low.onnx",
  "fr_FR-mls-medium": "fr/fr_FR/mls/medium/fr_FR-mls-medium.onnx",
  "fr_FR-mls_1840-low": "fr/fr_FR/mls_1840/low/fr_FR-mls_1840-low.onnx",
  "fr_FR-siwis-low": "fr/fr_FR/siwis/low/fr_FR-siwis-low.onnx",
  "fr_FR-siwis-medium": "fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx",
  "fr_FR-tom-medium": "fr/fr_FR/tom/medium/fr_FR-tom-medium.onnx",
  "fr_FR-upmc-medium": "fr/fr_FR/upmc/medium/fr_FR-upmc-medium.onnx",
  "hu_HU-anna-medium": "hu/hu_HU/anna/medium/hu_HU-anna-medium.onnx",
  "hu_HU-berta-medium": "hu/hu_HU/berta/medium/hu_HU-berta-medium.onnx",
  "hu_HU-imre-medium": "hu/hu_HU/imre/medium/hu_HU-imre-medium.onnx",
  "is_IS-bui-medium": "is/is_IS/bui/medium/is_IS-bui-medium.onnx",
  "is_IS-salka-medium": "is/is_IS/salka/medium/is_IS-salka-medium.onnx",
  "is_IS-steinn-medium": "is/is_IS/steinn/medium/is_IS-steinn-medium.onnx",
  "is_IS-ugla-medium": "is/is_IS/ugla/medium/is_IS-ugla-medium.onnx",
  "it_IT-riccardo-x_low": "it/it_IT/riccardo/x_low/it_IT-riccardo-x_low.onnx",
  "ka_GE-natia-medium": "ka/ka_GE/natia/medium/ka_GE-natia-medium.onnx",
  "kk_KZ-iseke-x_low": "kk/kk_KZ/iseke/x_low/kk_KZ-iseke-x_low.onnx",
  "kk_KZ-issai-high": "kk/kk_KZ/issai/high/kk_KZ-issai-high.onnx",
  "kk_KZ-raya-x_low": "kk/kk_KZ/raya/x_low/kk_KZ-raya-x_low.onnx",
  "lb_LU-marylux-medium": "lb/lb_LU/marylux/medium/lb_LU-marylux-medium.onnx",
  "ne_NP-google-medium": "ne/ne_NP/google/medium/ne_NP-google-medium.onnx",
  "ne_NP-google-x_low": "ne/ne_NP/google/x_low/ne_NP-google-x_low.onnx",
  "nl_BE-nathalie-medium": "nl/nl_BE/nathalie/medium/nl_BE-nathalie-medium.onnx",
  "nl_BE-nathalie-x_low": "nl/nl_BE/nathalie/x_low/nl_BE-nathalie-x_low.onnx",
  "nl_BE-rdh-medium": "nl/nl_BE/rdh/medium/nl_BE-rdh-medium.onnx",
  "nl_BE-rdh-x_low": "nl/nl_BE/rdh/x_low/nl_BE-rdh-x_low.onnx",
  "nl_NL-mls-medium": "nl/nl_NL/mls/medium/nl_NL-mls-medium.onnx",
  "nl_NL-mls_5809-low": "nl/nl_NL/mls_5809/low/nl_NL-mls_5809-low.onnx",
  "nl_NL-mls_7432-low": "nl/nl_NL/mls_7432/low/nl_NL-mls_7432-low.onnx",
  "no_NO-talesyntese-medium": "no/no_NO/talesyntese/medium/no_NO-talesyntese-medium.onnx",
  "pl_PL-darkman-medium": "pl/pl_PL/darkman/medium/pl_PL-darkman-medium.onnx",
  "pl_PL-gosia-medium": "pl/pl_PL/gosia/medium/pl_PL-gosia-medium.onnx",
  "pl_PL-mc_speech-medium": "pl/pl_PL/mc_speech/medium/pl_PL-mc_speech-medium.onnx",
  "pl_PL-mls_6892-low": "pl/pl_PL/mls_6892/low/pl_PL-mls_6892-low.onnx",
  "pt_BR-edresson-low": "pt/pt_BR/edresson/low/pt_BR-edresson-low.onnx",
  "pt_BR-faber-medium": "pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx",
  "pt_PT-tugão-medium": "pt/pt_PT/tugão/medium/pt_PT-tugão-medium.onnx",
  "ro_RO-mihai-medium": "ro/ro_RO/mihai/medium/ro_RO-mihai-medium.onnx",
  "ru_RU-denis-medium": "ru/ru_RU/denis/medium/ru_RU-denis-medium.onnx",
  "ru_RU-dmitri-medium": "ru/ru_RU/dmitri/medium/ru_RU-dmitri-medium.onnx",
  "ru_RU-irina-medium": "ru/ru_RU/irina/medium/ru_RU-irina-medium.onnx",
  "ru_RU-ruslan-medium": "ru/ru_RU/ruslan/medium/ru_RU-ruslan-medium.onnx",
  "sk_SK-lili-medium": "sk/sk_SK/lili/medium/sk_SK-lili-medium.onnx",
  "sl_SI-artur-medium": "sl/sl_SI/artur/medium/sl_SI-artur-medium.onnx",
  "sr_RS-serbski_institut-medium": "sr/sr_RS/serbski_institut/medium/sr_RS-serbski_institut-medium.onnx",
  "sv_SE-nst-medium": "sv/sv_SE/nst/medium/sv_SE-nst-medium.onnx",
  "sw_CD-lanfrica-medium": "sw/sw_CD/lanfrica/medium/sw_CD-lanfrica-medium.onnx",
  "tr_TR-dfki-medium": "tr/tr_TR/dfki/medium/tr_TR-dfki-medium.onnx",
  "tr_TR-fahrettin-medium": "tr/tr_TR/fahrettin/medium/tr_TR-fahrettin-medium.onnx",
  "tr_TR-fettah-medium": "tr/tr_TR/fettah/medium/tr_TR-fettah-medium.onnx",
  "uk_UA-lada-x_low": "uk/uk_UA/lada/x_low/uk_UA-lada-x_low.onnx",
  "uk_UA-ukrainian_tts-medium": "uk/uk_UA/ukrainian_tts/medium/uk_UA-ukrainian_tts-medium.onnx",
  "vi_VN-25hours_single-low": "vi/vi_VN/25hours_single/low/vi_VN-25hours_single-low.onnx",
  "vi_VN-vais1000-medium": "vi/vi_VN/vais1000/medium/vi_VN-vais1000-medium.onnx",
  "vi_VN-vivos-x_low": "vi/vi_VN/vivos/x_low/vi_VN-vivos-x_low.onnx",
  "zh_CN-huayan-medium": "zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx",
  "zh_CN-huayan-x_low": "zh/zh_CN/huayan/x_low/zh_CN-huayan-x_low.onnx"
};
async function p(e, m) {
  if (e.match("https://huggingface.co"))
    try {
      const o = await (await navigator.storage.getDirectory()).getDirectoryHandle("piper", {
        create: !0
      }), a = e.split("/").at(-1), t = await (await o.getFileHandle(a, { create: !0 })).createWritable();
      await t.write(m), await t.close();
    } catch (n) {
      console.error(n);
    }
}
async function R(e) {
  try {
    const n = await (await navigator.storage.getDirectory()).getDirectoryHandle("piper"), o = e.split("/").at(-1);
    await (await n.getFileHandle(o)).remove();
  } catch (m) {
    console.error(m);
  }
}
async function D(e) {
  if (e.match("https://huggingface.co"))
    try {
      const n = await (await navigator.storage.getDirectory()).getDirectoryHandle("piper", {
        create: !0
      }), o = e.split("/").at(-1);
      return await (await n.getFileHandle(o)).getFile();
    } catch {
      return;
    }
}
async function S(e, m) {
  var r;
  const n = await fetch(e), o = (r = n.body) == null ? void 0 : r.getReader(), a = +(n.headers.get("Content-Length") ?? 0);
  let i = 0, t = [];
  for (; o; ) {
    const { done: s, value: d } = await o.read();
    if (s)
      break;
    t.push(d), i += d.length, m == null || m({
      url: e,
      total: a,
      loaded: i
    });
  }
  const blob = new Blob(t, { type: n.headers.get("Content-Type") ?? void 0 });
  // Un fichier modifié ou incomplet n'est ni utilisé ni mis en cache.
  if (!await integrityOk(e, blob)) throw new Error(`Empreinte invalide pour ${e.split("/").at(-1)}`);
  return blob;
}
function b(e, m, n) {
  const o = e.length, a = 44, i = new DataView(new ArrayBuffer(o * m * 2 + a));
  i.setUint32(0, 1179011410, !0), i.setUint32(4, i.buffer.byteLength - 8, !0), i.setUint32(8, 1163280727, !0), i.setUint32(12, 544501094, !0), i.setUint32(16, 16, !0), i.setUint16(20, 1, !0), i.setUint16(22, m, !0), i.setUint32(24, n, !0), i.setUint32(28, m * 2 * n, !0), i.setUint16(32, m * 2, !0), i.setUint16(34, 16, !0), i.setUint32(36, 1635017060, !0), i.setUint32(40, 2 * o, !0);
  let t = a;
  for (let r = 0; r < o; r++) {
    const s = e[r];
    s >= 1 ? i.setInt16(t, 32767, !0) : s <= -1 ? i.setInt16(t, -32768, !0) : i.setInt16(t, s * 32768 | 0, !0), t += 2;
  }
  return i.buffer;
}
let h, _, activeVoice;
let phonemizer, phonemizerUses = 0, phonemeResult;

// Le worker sérialise les demandes : les callbacks du module WASM peuvent écrire
// dans le résultat courant. Rotation bornée pour les allocations internes du CLI.
async function preparePhonemizer() {
  if (!phonemizer || phonemizerUses >= 128) {
    phonemizer = null;
    phonemizerUses = 0;
    phonemizer = await h.createPiperPhonemize({
      print(line) {
        if (!phonemeResult) return;
        try { phonemeResult.ids = JSON.parse(line).phoneme_ids; }
        catch (error) { phonemeResult.error = error; }
      },
      printErr(line) {
        const error = new Error(line);
        if (phonemeResult) phonemeResult.error = error;
        else throw error;
      },
      locateFile(file) {
        return file.endsWith(".wasm") ? `${x}.wasm` : file.endsWith(".data") ? `${x}.data` : file;
      }
    });
  }
}

async function phonemeIds(text, voice) {
  await preparePhonemizer();
  const result = { ids: null, error: null };
  phonemeResult = result;
  try {
    phonemizerUses++;
    const code = phonemizer.callMain([
      "-l", voice, "--input", JSON.stringify([{ text: text.trim() }]),
      "--espeak_data", "/espeak-ng-data"
    ]);
    if (result.error) throw result.error;
    if (code !== 0 || !Array.isArray(result.ids) || !result.ids.length) {
      throw new Error("Le phonémiseur n'a pas produit de résultat.");
    }
    return result.ids;
  } catch (error) {
    phonemizer = null;
    throw error instanceof Error ? error : new Error(`Erreur du phonémiseur : ${error}`);
  } finally {
    phonemeResult = null;
  }
}

// Une seule session ONNX pour toute la lecture. Créer un modèle par phrase sans
// release() accumule les allocations WASM et finit par faire avorter le moteur.
async function voiceSession(voiceId, onProgress) {
  if (activeVoice?.id === voiceId) return activeVoice;
  if (activeVoice) {
    const previous = activeVoice;
    activeVoice = null;
    await previous.session.release();
  }
  const modelPath = c[voiceId];
  const [configBlob, model] = await Promise.all([
    f(`${u}/${modelPath}.json`), f(`${u}/${modelPath}`, onProgress)
  ]);
  const config = JSON.parse(await configBlob.text());
  const session = await _.InferenceSession.create(await model.arrayBuffer());
  activeVoice = { id: voiceId, config, session };
  return activeVoice;
}

// Le préchargement prépare également les runtimes. Le phonémiseur et le modèle
// se chargent ensemble, avant le clic PARLE/MP3, sans générer de son inutile.
async function prepareVoice(voiceId, onProgress) {
  if (!h || !_) {
    [h, _] = await Promise.all([
      import("./piper-DeOu3H9E.js"),
      import("https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/wasm/+esm")
    ]);
    _.env.wasm.numThreads = globalThis.crossOriginIsolated
      ? Math.max(1, Math.min(4, Math.floor((navigator.hardwareConcurrency || 2) / 2))) : 1;
    _.env.wasm.wasmPaths = B;
  }
  const [voice] = await Promise.all([voiceSession(voiceId, onProgress), preparePhonemizer()]);
  return voice;
}

async function N(e, m) {
  const { config: i, session: y } = await prepareVoice(e.voiceId, m);
  const t = await phonemeIds(e.text, i.espeak.voice), r = 0, s = i.audio.sample_rate, d = i.inference.noise_scale, g = e.lengthScale ?? i.inference.length_scale, U = i.inference.noise_w, w = {
    input: new _.Tensor("int64", t, [1, t.length]),
    input_lengths: new _.Tensor("int64", [t.length]),
    scales: new _.Tensor("float32", [d, g, U])
  };
  Object.keys(i.speaker_id_map).length && Object.assign(w, { sid: new _.Tensor("int64", [r]) });
  let outputs;
  try {
    outputs = await y.run(w);
    return new Blob([b(outputs.output.data, 1, s)], { type: "audio/x-wav" });
  } catch (error) {
    if (activeVoice?.session === y) activeVoice = null;
    await y.release().catch(() => {});
    throw error;
  } finally {
    for (const tensor of Object.values(w)) tensor.dispose?.();
    for (const tensor of Object.values(outputs ?? {})) tensor.dispose?.();
  }
}
async function f(e, m) {
  let n = await D(e);
  // Un fichier en cache abîmé ou modifié est remplacé par un téléchargement vérifié.
  if (n && !await integrityOk(e, n)) { await R(e); n = void 0; }
  return n || (n = await S(e, m), await p(e, n)), n;
}
async function I(e, m) {
  const n = c[e], o = [`${u}/${n}`, `${u}/${n}.json`];
  await Promise.all(
    o.map(async (a) => {
      p(a, await S(a, a.endsWith(".onnx") ? m : void 0));
    })
  );
}
async function F(e) {
  const m = c[e], n = [`${u}/${m}`, `${u}/${m}.json`];
  await Promise.all(n.map((o) => R(o)));
}
async function L() {
  const m = await (await navigator.storage.getDirectory()).getDirectoryHandle("piper", {
    create: !0
  }), n = [];
  for await (const o of m.keys()) {
    const a = o.split(".")[0];
    o.endsWith(".onnx") && a in c && n.push(a);
  }
  return n;
}
async function j() {
  try {
    await (await (await navigator.storage.getDirectory()).getDirectoryHandle("piper")).remove({ recursive: !0 });
  } catch (e) {
    console.error(e);
  }
}
async function P() {
  const e = await fetch(`${u}/voices.json`);
  if (!e.ok)
    throw new Error("Could not retrieve voices file from huggingface");
  return Object.values(await e.json());
}
export {
  u as HF_BASE,
  B as ONNX_BASE,
  c as PATH_MAP,
  x as WASM_BASE,
  I as download,
  j as flush,
  N as predict,
  prepareVoice,
  F as remove,
  L as stored,
  P as voices
};
