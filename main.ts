import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX_BYTES = 1048576;
const MAX_DIMENSION = 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function loadVerifiedImage(sourceUrl: URL): Buffer {
  const bytes = readFileSync(sourceUrl);
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    throw new Error(`Invalid image size: ${bytes.length} bytes`);
  }
  const isPng = bytes.subarray(0, 8).equals(PNG_MAGIC);
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
  if (!isPng && !isJpeg) {
    throw new Error('Asset must be a valid PNG or JPEG image');
  }
  if (isPng) {
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    if (width === 0 || height === 0 || width > MAX_DIMENSION || height > MAX_DIMENSION) {
      throw new Error(`PNG dimensions out of bounds: ${width}x${height}`);
    }
  }
  return bytes;
}

function main(): void {
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(outputDir, { recursive: true });
  const assetUrl = new URL('./entry.png', import.meta.url);
  const imageBytes = loadVerifiedImage(assetUrl);
  const destination = join(outputDir, 'entry.png');
  writeFileSync(destination, imageBytes, { mode: 0o644 });
}

main();
