// Safari ne sait pas parcourir un ReadableStream avec « for await », et pdf.js s'en sert.
ReadableStream.prototype[Symbol.asyncIterator] ??= async function* () {
  const reader = this.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
};
