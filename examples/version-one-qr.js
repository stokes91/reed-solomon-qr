/*
   Copyright 2020 Alexander Stokes

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

const BLOCKS_LENGTH = 26;
const BLOCKS_DATA = 10;
const ERROR_BLOCKS_COUNT = 7;

const AlphaNumeric = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'.split('');

function AlphaNumericToBuffer(data) {

  const blocks = Buffer.alloc(BLOCKS_DATA);

  const codes = [];
  for (let i = 0; i < 8; i += 2) {
    codes.push(AlphaNumeric.indexOf(data[i]) * 45 + AlphaNumeric.indexOf(data[i + 1]));
  }

  blocks.writeUInt8(0x20, 0);
  blocks.writeUInt8(0x40 + (codes[0] >>> 8), 1);
  blocks.writeUInt8((codes[0] & 0xFF), 2);
  blocks.writeUInt8((codes[1] >>> 3), 3);
  blocks.writeUInt8(((codes[1] << 5) & 0xFF) + (codes[2] >>> 6), 4);
  blocks.writeUInt8(((codes[2] << 2) & 0xFF) + (codes[3] >>> 9), 5);
  blocks.writeUInt8((codes[3] >>> 1) & 0xFF, 6);
  blocks.writeUInt8(((codes[3] << 7) & 0xFF), 7);
  blocks.writeUInt8(0xEC, 8);
  blocks.writeUInt8(0x00, 9);

  return blocks;
}


const ReedSolomonDecoder = require('../main').ReedSolomonDecoder;

const rse = require('../main').ReedSolomonEncoder.factory(BLOCKS_LENGTH - BLOCKS_DATA);

const startTime = (new Date).getTime();

let errorCount = 0;
let verifiedCount = 0;
let repairedCount = 0;


for (let l = 100000; l--;) {

  const data = new Array(8);
  for (let i = 0; i < 8; i++) {
    data[i] = AlphaNumeric[Math.floor(Math.random() * 45)];
  }

  const buffer = AlphaNumericToBuffer(data.join(''));
  const array = new Array(buffer.byteLength);
  for (let l = buffer.byteLength; l--;) {
    array[l] = (buffer.readUInt8(l)) & 0xff;
  }

  // Append ECC Blocks
  //
  const out = rse.encode(array);

  // Corrupt the data in varying amounts and locations
  //
  const setErrors = [];
  for (let l = BLOCKS_LENGTH; l--;) {
    setErrors.push({ at: l, score: Math.random(), by: Math.floor(Math.random() * 255) + 1 });
  }

  setErrors.sort((a, b) => {
    if (a.score > b.score) return 1;
    if (a.score < b.score) return -1;
    return 0;
  });

  setErrors.splice(0, setErrors.length - ERROR_BLOCKS_COUNT);

  setErrors.forEach((err) => {
    out[err.at] ^= err.by;
  });



  // Repair buffer 'out' in place.
  // Returns:
  //  - false if no errors present
  //  - undefined if errors repaired
  //  - true if data could not be recovered
  //
  const err = ReedSolomonDecoder(out, BLOCKS_LENGTH - BLOCKS_DATA);

  if (out.slice(0, BLOCKS_DATA).map(x => x.toString(16).padStart(2, '0')).join('') !== array.slice(0, BLOCKS_DATA).map(x => x.toString(16).padStart(2, '0')).join('')) {
    errorCount += 1;
  }
  else if (err === false) {
    verifiedCount += 1;
  }
  else {
    repairedCount += 1;
  }
}

console.log('Finished in', (new Date).getTime() - startTime, 'ms', { errorCount, verifiedCount, repairedCount });
