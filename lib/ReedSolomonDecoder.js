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

const { Zero, Multiply, Invert, Log, Exp, Add } = require('./GaloisField');

const GaloisFieldPolynomial = require('./GaloisFieldPolynomial');

function ReedSolomonDecoder(buffer, BLOCKS_ECC) {
  const poly = GaloisFieldPolynomial.fromBuffer(buffer);

  const rsSyndrome = GaloisFieldPolynomial.monomial(BLOCKS_ECC, 0);

  for (let i = BLOCKS_ECC; i--;) {
    let evald = poly.evaluateAt(Exp(i));
    rsSyndrome.coefficients[i] = evald;
  }

  rsSyndrome.reduce();

  if (rsSyndrome.degree() === 0) return false;

  const R = BLOCKS_ECC / 2;
  let t = GaloisFieldPolynomial.monomial(1, 0);
  let qLast = GaloisFieldPolynomial.monomial(1, 1);
  let r = GaloisFieldPolynomial.monomial(BLOCKS_ECC, 1);
  let rLast = rsSyndrome;

  while (rLast.coefficients.length >= R) {
    if (Zero(rLast.leadingCoefficient())) {
      return true;
    }

    const q = GaloisFieldPolynomial.monomial(1, 0);
    const denominatorLeadingTerm = Invert(rLast.leadingCoefficient());

    while (r.degree() >= rLast.degree() && !Zero(r.leadingCoefficient())) {
      const degreeDiff = r.degree() - rLast.degree();
      const scale = Multiply(r.leadingCoefficient(), denominatorLeadingTerm);

      q.add(GaloisFieldPolynomial.monomial(degreeDiff + 1, scale));
      r.add(GaloisFieldPolynomial.multiplyByMonomial(rLast, degreeDiff, scale));
    }

    const rNext = rLast;
    const tNext = qLast;

    rLast = r;
    qLast = q.multiply(qLast).add(t);

    r = rNext;
    t = tNext;

    if (rLast.degree() >= r.degree()) {
      return true;
    }
  }

  if (Zero(qLast.constantCoefficient())) {
    return true;
  }

  const inverse = Invert(qLast.constantCoefficient());

  const locator = qLast.multiplyByScalar(inverse);
  const evaluator = rLast.multiplyByScalar(inverse);

  const rsErrorLocations = [];
  const errorCount = locator.degree();

  if (errorCount === 1) {
    rsErrorLocations.push(locator.leadingCoefficient());
  }
  else {
    for (let i = 1; i < 0x100 && rsErrorLocations.length < errorCount; i++) {
      const inverted = Invert(i);

      if (Zero(locator.evaluateAt(inverted))) {
        rsErrorLocations.push(i);
      }
    }

    if (rsErrorLocations.length !== errorCount) return true;
  }

  for (let i = 0; i < errorCount; i++) {
    const inverted = Invert(rsErrorLocations[i]);

    let denominator = 1;
    for (var j = 0; j < errorCount; j++) {
      if (i === j) continue;
      denominator = Multiply(denominator, Add(Multiply(inverted, rsErrorLocations[j]), 1));
    }

    const eccPosition = buffer.byteLength - Log(rsErrorLocations[i]) - 1;
    if (eccPosition < 0) {
      return true;
    }

    const eccByte = Multiply(Invert(denominator), evaluator.evaluateAt(inverted));
    buffer.writeUInt8(Add(buffer.readUInt8(eccPosition), eccByte), eccPosition);
  }

  return;
}

module.exports = ReedSolomonDecoder;
