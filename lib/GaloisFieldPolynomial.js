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

const { Zero, One, Multiply, Add } = require('./GaloisField');

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

module.exports = GaloisFieldPolynomial;
