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

const { Zero, Multiply, Invert, Log, Exp, Add, Divide, Size } = require('./GaloisField');

const GaloisFieldPolynomial = require('./GaloisFieldPolynomial');

function ReedSolomonDecoder(array, BLOCKS_ECC) {
  const poly = GaloisFieldPolynomial.fromArray(array);

  const rsSyndrome = GaloisFieldPolynomial.monomial(BLOCKS_ECC, 0);

  for (let i = BLOCKS_ECC; i--;) {
    let evald = poly.evaluateAt(Exp(i));
    rsSyndrome.coefficients[i] = evald;
  }

  rsSyndrome.reduce();

  if (rsSyndrome.degree() === 0) return false;

  const R = BLOCKS_ECC / 2;
  let t = GaloisFieldPolynomial.monomial(0, 0);
  let qLast = GaloisFieldPolynomial.monomial(0, 1);
  let r = GaloisFieldPolynomial.monomial(BLOCKS_ECC, 1);
  let rLast = rsSyndrome;

  while (rLast.coefficients.length >= R) {
    if (Zero(rLast.leadingCoefficient())) {
      return true;
    }

    const q = GaloisFieldPolynomial.monomial(0, 0);

    while (r.degree() >= rLast.degree() && !Zero(r.leadingCoefficient())) {
      const degreeDiff = r.degree() - rLast.degree();
      const scale = Divide(r.leadingCoefficient(), rLast.leadingCoefficient());

      q.add(GaloisFieldPolynomial.monomial(degreeDiff, scale));
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

  const evaluator = rLast.divideByScalar(qLast.constantCoefficient());
  const zeroes = qLast.divideByScalar(qLast.constantCoefficient()).findZeroes();

  for (let i = 0; i < zeroes.length; i++) {
    const eccPosition = array.length - Log(Invert(zeroes[i])) - 1;
    if (eccPosition < 0 || eccPosition > array.length) {
      continue;
    }

    let denominator = 1;
    for (var j = 0; j < zeroes.length; j++) {
      if (i === j) continue;
      denominator = Multiply(denominator, Add(1, Divide(zeroes[i], zeroes[j])));
    }

    array[eccPosition] ^= Divide(evaluator.evaluateAt(zeroes[i]), denominator);
  }

  return;
}

module.exports = ReedSolomonDecoder;
