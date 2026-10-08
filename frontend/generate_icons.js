import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r, g, b) {
  // Simple uncompressed or deflate PNG generator
  const buffer = Buffer.alloc(8 + 25 + (1 + width * 4) * height + 12);
  
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // compression method 0
  ihdrData.writeUInt8(0, 11); // filter method 0
  ihdrData.writeUInt8(0, 12); // interlace method 0
  
  function makeChunk(type, data) {
    const len = data.length;
    const chunk = Buffer.alloc(8 + len + 4);
    chunk.writeUInt32BE(len, 0);
    chunk.write(type, 4, 4, 'ascii');
    data.copy(chunk, 8);
    const crcVal = crc32(chunk.subarray(4, 8 + len));
    chunk.writeUInt32BE(crcVal, 8 + len);
    return chunk;
  }
  
  // CRC32 implementation
  function crc32(buf) {
    let table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }
  
  const ihdrChunk = makeChunk('IHDR', ihdrData);
  
  // Raw scanlines
  const rawScanlines = Buffer.alloc((1 + width * 4) * height);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    rawScanlines.writeUInt8(0, pos++); // Filter type 0
    for (let x = 0; x < width; x++) {
      // Circular or rounded gold icon with border
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.hypot(x - cx, y - cy);
      const radius = width * 0.46;
      
      if (dist <= radius) {
        // Gold gradient with dark center accent
        const grad = (y / height) * 0.4 + 0.6;
        rawScanlines.writeUInt8(Math.min(255, Math.floor(r * grad)), pos++);
        rawScanlines.writeUInt8(Math.min(255, Math.floor(g * grad)), pos++);
        rawScanlines.writeUInt8(Math.min(255, Math.floor(b * grad)), pos++);
        rawScanlines.writeUInt8(255, pos++); // Alpha
      } else {
        rawScanlines.writeUInt8(7, pos++);
        rawScanlines.writeUInt8(10, pos++);
        rawScanlines.writeUInt8(19, pos++);
        rawScanlines.writeUInt8(255, pos++); // Dark obsidian background
      }
    }
  }
  
  const compressed = zlib.deflateSync(rawScanlines);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const icon192 = createPNG(192, 192, 245, 158, 11);
fs.writeFileSync('./public/icon-192.png', icon192);

const icon512 = createPNG(512, 512, 245, 158, 11);
fs.writeFileSync('./public/icon-512.png', icon512);

console.log('Successfully generated public/icon-192.png and public/icon-512.png');
