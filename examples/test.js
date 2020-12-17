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

const crypto = require('crypto');

const ReedSolomonDecoder = require('../ReedSolomonDecoder');

const rse = require('../ReedSolomonEncoder').factory(BLOCKS_LENGTH - BLOCKS_DATA);

const startTime = (new Date).getTime();

let errorCount = 0;
let verifiedCount = 0;
let repairedCount = 0;

for (let l = 5000; l--;) {

  const buffer = crypto.randomBytes(BLOCKS_DATA);

  // Append 32 ECC Blocks
  //
  const out = rse.encode(buffer);

  // Corrupt the data in varying amounts and locations
  //
  for (let i = 0; i < Math.floor(Math.random() * 15); i++) {
    out.writeUInt8(Math.floor(Math.random() * 256), Math.floor(Math.random() * 255));
  }

  // Repair buffer 'out' in place.
  // Returns:
  //  - false if no errors present
  //  - undefined if errors repaired
  //  - true if data could not be recovered
  //
  const err = ReedSolomonDecoder(out, BLOCKS_LENGTH - BLOCKS_DATA);

  if (out.slice(0, BLOCKS_DATA).toString('base64') !== buffer.slice(0, BLOCKS_DATA).toString('base64')) {
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
