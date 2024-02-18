import { resolve } from 'node:path';
import { getParsedStreamFromCache, cacheInit } from './cache';

it('test getParsedStreamFromCache', async () => {
  cacheInit(resolve(process.cwd(), '.siven_cache'));
  const id = 'oYJ1wYP4f0bQV10Z2dbb3';
  const readStream = await getParsedStreamFromCache(id);
  let str = '';
  readStream.on('data', (chunk) => {
    str += chunk.toString();
  });
  readStream.on('end', () => {
    const parsed = JSON.parse(str);
    expect(typeof parsed).toBe('object');
    expect(typeof parsed.html).toBe('string');
    expect(Array.isArray(parsed.outline)).toBe(true);
  });
});
