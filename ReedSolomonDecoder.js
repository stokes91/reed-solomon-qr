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

/* Usage Example

const buffer = Buffer.from('rs+decode+VyIFN0b2tlc+wLVx3ljAtuxtwnbdpISVUm', 'base64');
ReedSolomonDecoder(buffer, 17); // 17 Error Correcting Bytes

console.log(buffer.toString().substring(0, 16));

/* */

const ExpTable = [
  0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1d, 0x3a, 0x74, 0xe8, 0xcd, 0x87, 0x13, 0x26,
  0x4c, 0x98, 0x2d, 0x5a, 0xb4, 0x75, 0xea, 0xc9, 0x8f, 0x03, 0x06, 0x0c, 0x18, 0x30, 0x60, 0xc0,
  0x9d, 0x27, 0x4e, 0x9c, 0x25, 0x4a, 0x94, 0x35, 0x6a, 0xd4, 0xb5, 0x77, 0xee, 0xc1, 0x9f, 0x23,
  0x46, 0x8c, 0x05, 0x0a, 0x14, 0x28, 0x50, 0xa0, 0x5d, 0xba, 0x69, 0xd2, 0xb9, 0x6f, 0xde, 0xa1,
  0x5f, 0xbe, 0x61, 0xc2, 0x99, 0x2f, 0x5e, 0xbc, 0x65, 0xca, 0x89, 0x0f, 0x1e, 0x3c, 0x78, 0xf0,
  0xfd, 0xe7, 0xd3, 0xbb, 0x6b, 0xd6, 0xb1, 0x7f, 0xfe, 0xe1, 0xdf, 0xa3, 0x5b, 0xb6, 0x71, 0xe2,
  0xd9, 0xaf, 0x43, 0x86, 0x11, 0x22, 0x44, 0x88, 0x0d, 0x1a, 0x34, 0x68, 0xd0, 0xbd, 0x67, 0xce,
  0x81, 0x1f, 0x3e, 0x7c, 0xf8, 0xed, 0xc7, 0x93, 0x3b, 0x76, 0xec, 0xc5, 0x97, 0x33, 0x66, 0xcc,
  0x85, 0x17, 0x2e, 0x5c, 0xb8, 0x6d, 0xda, 0xa9, 0x4f, 0x9e, 0x21, 0x42, 0x84, 0x15, 0x2a, 0x54,
  0xa8, 0x4d, 0x9a, 0x29, 0x52, 0xa4, 0x55, 0xaa, 0x49, 0x92, 0x39, 0x72, 0xe4, 0xd5, 0xb7, 0x73,
  0xe6, 0xd1, 0xbf, 0x63, 0xc6, 0x91, 0x3f, 0x7e, 0xfc, 0xe5, 0xd7, 0xb3, 0x7b, 0xf6, 0xf1, 0xff,
  0xe3, 0xdb, 0xab, 0x4b, 0x96, 0x31, 0x62, 0xc4, 0x95, 0x37, 0x6e, 0xdc, 0xa5, 0x57, 0xae, 0x41,
  0x82, 0x19, 0x32, 0x64, 0xc8, 0x8d, 0x07, 0x0e, 0x1c, 0x38, 0x70, 0xe0, 0xdd, 0xa7, 0x53, 0xa6,
  0x51, 0xa2, 0x59, 0xb2, 0x79, 0xf2, 0xf9, 0xef, 0xc3, 0x9b, 0x2b, 0x56, 0xac, 0x45, 0x8a, 0x09,
  0x12, 0x24, 0x48, 0x90, 0x3d, 0x7a, 0xf4, 0xf5, 0xf7, 0xf3, 0xfb, 0xeb, 0xcb, 0x8b, 0x0b, 0x16,
  0x2c, 0x58, 0xb0, 0x7d, 0xfa, 0xe9, 0xcf, 0x83, 0x1b, 0x36, 0x6c, 0xd8, 0xad, 0x47, 0x8e, 0x01
];

const LogTable = [
  0x00, 0x00, 0x01, 0x19, 0x02, 0x32, 0x1a, 0xc6, 0x03, 0xdf, 0x33, 0xee, 0x1b, 0x68, 0xc7, 0x4b,
  0x04, 0x64, 0xe0, 0x0e, 0x34, 0x8d, 0xef, 0x81, 0x1c, 0xc1, 0x69, 0xf8, 0xc8, 0x08, 0x4c, 0x71,
  0x05, 0x8a, 0x65, 0x2f, 0xe1, 0x24, 0x0f, 0x21, 0x35, 0x93, 0x8e, 0xda, 0xf0, 0x12, 0x82, 0x45,
  0x1d, 0xb5, 0xc2, 0x7d, 0x6a, 0x27, 0xf9, 0xb9, 0xc9, 0x9a, 0x09, 0x78, 0x4d, 0xe4, 0x72, 0xa6,
  0x06, 0xbf, 0x8b, 0x62, 0x66, 0xdd, 0x30, 0xfd, 0xe2, 0x98, 0x25, 0xb3, 0x10, 0x91, 0x22, 0x88,
  0x36, 0xd0, 0x94, 0xce, 0x8f, 0x96, 0xdb, 0xbd, 0xf1, 0xd2, 0x13, 0x5c, 0x83, 0x38, 0x46, 0x40,
  0x1e, 0x42, 0xb6, 0xa3, 0xc3, 0x48, 0x7e, 0x6e, 0x6b, 0x3a, 0x28, 0x54, 0xfa, 0x85, 0xba, 0x3d,
  0xca, 0x5e, 0x9b, 0x9f, 0x0a, 0x15, 0x79, 0x2b, 0x4e, 0xd4, 0xe5, 0xac, 0x73, 0xf3, 0xa7, 0x57,
  0x07, 0x70, 0xc0, 0xf7, 0x8c, 0x80, 0x63, 0x0d, 0x67, 0x4a, 0xde, 0xed, 0x31, 0xc5, 0xfe, 0x18,
  0xe3, 0xa5, 0x99, 0x77, 0x26, 0xb8, 0xb4, 0x7c, 0x11, 0x44, 0x92, 0xd9, 0x23, 0x20, 0x89, 0x2e,
  0x37, 0x3f, 0xd1, 0x5b, 0x95, 0xbc, 0xcf, 0xcd, 0x90, 0x87, 0x97, 0xb2, 0xdc, 0xfc, 0xbe, 0x61,
  0xf2, 0x56, 0xd3, 0xab, 0x14, 0x2a, 0x5d, 0x9e, 0x84, 0x3c, 0x39, 0x53, 0x47, 0x6d, 0x41, 0xa2,
  0x1f, 0x2d, 0x43, 0xd8, 0xb7, 0x7b, 0xa4, 0x76, 0xc4, 0x17, 0x49, 0xec, 0x7f, 0x0c, 0x6f, 0xf6,
  0x6c, 0xa1, 0x3b, 0x52, 0x29, 0x9d, 0x55, 0xaa, 0xfb, 0x60, 0x86, 0xb1, 0xbb, 0xcc, 0x3e, 0x5a,
  0xcb, 0x59, 0x5f, 0xb0, 0x9c, 0xa9, 0xa0, 0x51, 0x0b, 0xf5, 0x16, 0xeb, 0x7a, 0x75, 0x2c, 0xd7,
  0x4f, 0xae, 0xd5, 0xe9, 0xe6, 0xe7, 0xad, 0xe8, 0x74, 0xd6, 0xf4, 0xea, 0xa8, 0x50, 0x58, 0xaf
];

function Log(x) {
  return LogTable[x];
}

function Exp(x) {
  return ExpTable[x];
}

function Add(x, y) {
  return x ^ y;
}

function Multiply(x, y) {
  if (x === 0 || y === 0) return 0;
  return ExpTable[(LogTable[x] + LogTable[y]) % 0xff];
}

function Invert(x) {
  return ExpTable[0xFF - LogTable[x]];
}

function Zero(x) {
  return x === 0;
}

function One(x) {
  return x === 1;
}

class GaloisFieldPolynomial {
  constructor() {}

  copy() {
    const that = new GaloisFieldPolynomial();
    that.coefficients = new Array(this.coefficients.length);
    for (let l = this.coefficients.length; l--;) {
      that.coefficients[l] = this.coefficients[l];
    }
    return that;
  }

  reduce() {
    let l = this.coefficients.length;
    if (l === 1) {
      return this;
    }

    while (this.coefficients.length > 1 && Zero(this.leadingCoefficient())) {
      this.coefficients = this.coefficients.slice(0, this.degree());
    }

    return this;
  }

  degree() {
    return this.coefficients.length - 1;
  }

  leadingCoefficient() {
    return this.coefficients[this.degree()];
  }

  constantCoefficient() {
    return this.coefficients[0];
  }

  coefficientAt(i) {
    if (i > this.degree())
      return 0;

    return this.coefficients[i];
  }

  evaluateAt(a) {
    if (Zero(a)) {
      return this.constantCoefficient();
    }
    else if (One(a)) {
      let result = 0;
      for (let l = this.coefficients.length; l--;) {
        result = Add(result, this.coefficients[l]);
      }
      return result;
    }

    let result = this.leadingCoefficient();
    for (let l = this.degree(); l--;) {
      result = Add(Multiply(result, a), this.coefficients[l]);
    }

    return result;
  }

  add(that) {
    for (let l = Math.max(this.coefficients.length, that.coefficients.length), i = 0; l--; i++) {
      this.coefficients[i] = Add(this.coefficientAt(i), that.coefficientAt(i));
    }

    return this.reduce();
  }

  multiply(that) {
    const newSize = that.coefficients.length + this.coefficients.length + 1;
    const coefficients = new Array(newSize);
    for (let l = newSize; l--;) {
      coefficients[l] = 0;
    }

    that.coefficients.map((that) => {
      return this.copy().multiplyByScalar(that);
    }).forEach((that, i) => {
      that.coefficients.forEach((that, j) => {
        coefficients[i + j] = Add(coefficients[i + j], that);
      });
    });

    this.coefficients = coefficients;
    return this.reduce();
  }

  multiplyByScalar(coefficient) {
    for (let l = this.coefficients.length; l--;) {
      this.coefficients[l] = Multiply(this.coefficients[l], coefficient);
    }

    return this;
  }

  toLaTeX() {
    const cols = this.coefficients.map((coefficient, power) => {
      return { coefficient, power };
    }).filter((that) => {
      return !Zero(that.coefficient);
    }).reverse().map((that) => {
      const { coefficient, power } = that;
      if (power === 0) {
        return `${coefficient.toLaTeX()}`;
      }
      else if (power === 1) {
        return `${coefficient.toLaTeX()}a`;
      }

      let powerString = power.toString();
      if (powerString.length > 1) powerString = '{' + powerString + '}';
      return `\\text{${this.a.toString(16).padStart(2, '0').toUpperCase()}}_{16}a^${powerString}`;
    });

    if (!cols.length) {
      cols.push(this.constantCoefficient().toString());
    }

    return cols.join(' + ');
  }
}

GaloisFieldPolynomial.fromCoefficients = (coefficients) => {
  const that = new GaloisFieldPolynomial();
  let l = coefficients.length;
  if (l !== 1) {
    for (; l--;) {
      if (coefficients[l] !== 0) break;
    }
  }

  that.coefficients = coefficients.slice(0, l + 1);

  return that;
};

GaloisFieldPolynomial.multiplyByMonomial = (other, degree, scale) => {
  const that = other.copy().multiplyByScalar(scale);
  for (let l = degree; l--;) {
    that.coefficients.unshift(0);
  }

  return that;
};

GaloisFieldPolynomial.monomial = (degree, scale) => {
  const that = new GaloisFieldPolynomial();
  that.coefficients = new Array(degree);
  for (let l = degree; l--;) {
    that.coefficients[l] = 0;
  }
  that.coefficients[degree - 1] = scale;

  return that;
};

GaloisFieldPolynomial.fromBuffer = (buffer) => {
  const that = new GaloisFieldPolynomial();
  that.coefficients = new Array(buffer.byteLength);
  for (let l = buffer.byteLength, i = 0; l--; i++) {
    that.coefficients[i] = buffer.readUInt8(l);
  }
  that.reduce();

  return that;
};

function ReedSolomonDecoder(buffer, BLOCKS_ECC) {
  const poly = GaloisFieldPolynomial.fromBuffer(buffer);

  const rsSyndrome = GaloisFieldPolynomial.monomial(BLOCKS_ECC, 0);

  for (let i = BLOCKS_ECC; i--;) {
    let evald = poly.evaluateAt(Exp(i));
    rsSyndrome.coefficients[i] = evald;
  }

  rsSyndrome.reduce();

  if (rsSyndrome.degree() === -1) return false;

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

  return false;
}

module.exports = ReedSolomonDecoder;
