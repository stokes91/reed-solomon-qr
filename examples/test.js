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

const BLOCKS_LENGTH = 255;
const BLOCKS_DATA = 223;
const ERROR_BLOCKS_COUNT = 15;

const crypto = require('crypto');

const ReedSolomonDecoder = require('../main').ReedSolomonDecoder;

const rse = require('../main').ReedSolomonEncoder.factory(BLOCKS_LENGTH - BLOCKS_DATA);

const startTime = (new Date).getTime();

let errorCount = 0;
let verifiedCount = 0;
let repairedCount = 0;


for (let l = 5500; l--;) {

  const buffer = crypto.randomBytes(BLOCKS_DATA);
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
