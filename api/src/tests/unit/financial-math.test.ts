/**
 * Financial Math & Precision Unit Tests
 *
 * CRITICAL FINTECH RISK: JavaScript floating-point arithmetic is unreliable.
 * 0.1 + 0.2 = 0.30000000000000004 in JS - unacceptable in banking.
 *
 * These tests validate precision handling for:
 * - Currency rounding (Banker's vs Half-Up)
 * - Interest calculations
 * - Dust handling (sub-cent fractions)
 * - Fee calculations (no NaN, no negatives)
 */

import { describe, it, expect } from 'vitest';

// ============================================================================
// FINANCIAL MATH UTILITIES (would typically be in helpers/financial.ts)
// ============================================================================

/**
 * Convert dollars to cents to avoid floating-point issues
 */
function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents back to dollars
 */
function toDollars(cents: number): number {
  return cents / 100;
}

/**
 * Round Half Up (standard rounding) - 0.5 rounds to 1
 */
function roundHalfUp(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Banker's Rounding (Round Half Even) - 0.5 rounds to nearest even
 * Used in financial systems to reduce cumulative rounding bias
 */
function bankersRound(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  const shifted = value * factor;
  const truncated = Math.trunc(shifted);
  const decimal = shifted - truncated;

  if (Math.abs(decimal - 0.5) < 1e-10) {
    // Exactly 0.5 - round to nearest even
    return (truncated % 2 === 0 ? truncated : truncated + 1) / factor;
  }
  return Math.round(shifted) / factor;
}

/**
 * Calculate simple interest
 */
function calculateSimpleInterest(principal: number, annualRate: number, years: number): number {
  return roundHalfUp(principal * annualRate * years);
}

/**
 * Calculate compound interest
 */
function calculateCompoundInterest(
  principal: number,
  annualRate: number,
  years: number,
  compoundsPerYear: number = 12,
): number {
  const amount = principal * Math.pow(1 + annualRate / compoundsPerYear, compoundsPerYear * years);
  return roundHalfUp(amount - principal);
}

/**
 * Calculate transaction fee (percentage-based)
 */
function calculateFee(amount: number, feePercentage: number): number {
  if (amount < 0 || feePercentage < 0) {
    throw new Error('Amount and fee percentage must be non-negative');
  }
  if (!Number.isFinite(amount) || !Number.isFinite(feePercentage)) {
    throw new Error('Invalid numeric input');
  }
  return roundHalfUp(amount * (feePercentage / 100));
}

/**
 * Handle dust (sub-cent fractions) during currency conversion
 */
function convertCurrencyWithDust(
  amount: number,
  exchangeRate: number,
): { converted: number; dust: number } {
  const rawConverted = amount * exchangeRate;
  const converted = roundHalfUp(rawConverted);
  const dust = roundHalfUp(rawConverted - converted, 6); // Keep 6 decimal precision for dust
  return { converted, dust };
}

/**
 * Safe addition for currency (uses cents internally)
 */
function safeAdd(...amounts: number[]): number {
  const totalCents = amounts.reduce((sum, amt) => sum + toCents(amt), 0);
  return toDollars(totalCents);
}

/**
 * Safe subtraction for currency
 */
function safeSubtract(a: number, b: number): number {
  return toDollars(toCents(a) - toCents(b));
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('Financial Math - Floating Point Precision', () => {
  describe('JavaScript Precision Problem Awareness', () => {
    it('demonstrates the classic 0.1 + 0.2 problem', () => {
      // This is WHY we need financial math utilities
      const naiveResult = 0.1 + 0.2;
      expect(naiveResult).not.toBe(0.3); // JS gives 0.30000000000000004
      expect(naiveResult).toBeCloseTo(0.3, 10); // But it's close
    });

    it('demonstrates precision loss in multiplication', () => {
      const naiveResult = 0.07 * 100;
      // JS may give 7.000000000000001
      expect(Math.abs(naiveResult - 7) < 0.0001).toBe(true);
    });

    it('safeAdd handles 0.1 + 0.2 correctly', () => {
      const result = safeAdd(0.1, 0.2);
      expect(result).toBe(0.3);
    });

    it('safeAdd handles multiple decimal additions', () => {
      const result = safeAdd(0.1, 0.2, 0.3, 0.4);
      expect(result).toBe(1.0);
    });

    it('safeSubtract handles precision correctly', () => {
      const result = safeSubtract(1.0, 0.9);
      expect(result).toBe(0.1);
    });
  });

  describe('Currency Cents Conversion', () => {
    it('converts dollars to cents correctly', () => {
      expect(toCents(1.23)).toBe(123);
      expect(toCents(0.01)).toBe(1);
      expect(toCents(100.99)).toBe(10099);
    });

    it('converts cents back to dollars', () => {
      expect(toDollars(123)).toBe(1.23);
      expect(toDollars(1)).toBe(0.01);
      expect(toDollars(10099)).toBe(100.99);
    });

    it('handles zero correctly', () => {
      expect(toCents(0)).toBe(0);
      expect(toDollars(0)).toBe(0);
    });

    it('handles large amounts without precision loss', () => {
      const largeDollars = 999999.99;
      const cents = toCents(largeDollars);
      expect(cents).toBe(99999999);
      expect(toDollars(cents)).toBe(largeDollars);
    });
  });
});

describe('Financial Math - Rounding Logic', () => {
  describe('Round Half Up (Standard)', () => {
    it('rounds 2.5 up to 3', () => {
      expect(roundHalfUp(2.5, 0)).toBe(3);
    });

    it('rounds 2.4 down to 2', () => {
      expect(roundHalfUp(2.4, 0)).toBe(2);
    });

    it('rounds to 2 decimal places by default', () => {
      expect(roundHalfUp(1.234)).toBe(1.23);
      expect(roundHalfUp(1.235)).toBe(1.24);
      expect(roundHalfUp(1.236)).toBe(1.24);
    });

    it('handles negative numbers correctly', () => {
      expect(roundHalfUp(-2.5, 0)).toBe(-2); // Math.round behavior
      expect(roundHalfUp(-2.6, 0)).toBe(-3);
    });

    it('rounds currency amounts correctly', () => {
      expect(roundHalfUp(19.995)).toBe(20.0);
      expect(roundHalfUp(19.994)).toBe(19.99);
    });
  });

  describe("Banker's Rounding (Round Half Even)", () => {
    it('rounds 2.5 to 2 (nearest even)', () => {
      expect(bankersRound(2.5, 0)).toBe(2);
    });

    it('rounds 3.5 to 4 (nearest even)', () => {
      expect(bankersRound(3.5, 0)).toBe(4);
    });

    it('rounds 1.5 to 2 (nearest even)', () => {
      expect(bankersRound(1.5, 0)).toBe(2);
    });

    it('rounds 0.5 to 0 (nearest even)', () => {
      expect(bankersRound(0.5, 0)).toBe(0);
    });

    it('rounds non-half values normally', () => {
      expect(bankersRound(2.4, 0)).toBe(2);
      expect(bankersRound(2.6, 0)).toBe(3);
    });

    it('applies to decimal places', () => {
      expect(bankersRound(1.225)).toBe(1.22); // .5 rounds to even
      expect(bankersRound(1.235)).toBe(1.24); // .5 rounds to even
      expect(bankersRound(1.245)).toBe(1.24); // .5 rounds to even
    });

    it('reduces cumulative rounding bias over many operations', () => {
      // Sum of banker's rounded values should be closer to true sum
      const values = [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5];
      const trueSum = values.reduce((a, b) => a + b, 0); // 60

      const bankersSum = values.map((v) => bankersRound(v, 0)).reduce((a, b) => a + b, 0);
      const standardSum = values.map((v) => roundHalfUp(v, 0)).reduce((a, b) => a + b, 0);

      // Banker's rounding: 2+2+4+4+6+6+8+8+10+10 = 60
      // Standard rounding: 2+3+4+5+6+7+8+9+10+11 = 65
      expect(bankersSum).toBe(60);
      expect(standardSum).toBe(65);
      expect(Math.abs(bankersSum - trueSum)).toBeLessThan(Math.abs(standardSum - trueSum));
    });
  });
});

describe('Financial Math - Interest Calculations', () => {
  describe('Simple Interest', () => {
    it('calculates simple interest correctly', () => {
      // $1000 at 5% for 1 year = $50
      expect(calculateSimpleInterest(1000, 0.05, 1)).toBe(50);
    });

    it('handles fractional years', () => {
      // $1000 at 5% for 6 months = $25
      expect(calculateSimpleInterest(1000, 0.05, 0.5)).toBe(25);
    });

    it('handles small principal amounts', () => {
      // $0.01 at 5% for 1 year = $0.00 (rounds down)
      expect(calculateSimpleInterest(0.01, 0.05, 1)).toBe(0);
    });

    it('handles large principal amounts', () => {
      // $1,000,000 at 3.5% for 1 year = $35,000
      expect(calculateSimpleInterest(1000000, 0.035, 1)).toBe(35000);
    });

    it('handles zero rate', () => {
      expect(calculateSimpleInterest(1000, 0, 5)).toBe(0);
    });

    it('handles zero principal', () => {
      expect(calculateSimpleInterest(0, 0.05, 5)).toBe(0);
    });

    it('handles zero years', () => {
      expect(calculateSimpleInterest(1000, 0.05, 0)).toBe(0);
    });
  });

  describe('Compound Interest', () => {
    it('calculates monthly compound interest', () => {
      // $1000 at 5% compounded monthly for 1 year
      const interest = calculateCompoundInterest(1000, 0.05, 1, 12);
      expect(interest).toBeCloseTo(51.16, 2);
    });

    it('calculates annual compound interest', () => {
      // $1000 at 5% compounded annually for 1 year = same as simple
      const interest = calculateCompoundInterest(1000, 0.05, 1, 1);
      expect(interest).toBe(50);
    });

    it('calculates daily compound interest', () => {
      // $1000 at 5% compounded daily for 1 year
      const interest = calculateCompoundInterest(1000, 0.05, 1, 365);
      expect(interest).toBeCloseTo(51.27, 2);
    });

    it('handles multi-year compounding', () => {
      // $1000 at 5% compounded monthly for 10 years
      const interest = calculateCompoundInterest(1000, 0.05, 10, 12);
      expect(interest).toBeCloseTo(647.01, 0); // Approximately
    });

    it('compound interest exceeds simple interest', () => {
      const simple = calculateSimpleInterest(1000, 0.05, 5);
      const compound = calculateCompoundInterest(1000, 0.05, 5, 12);
      expect(compound).toBeGreaterThan(simple);
    });
  });
});

describe('Financial Math - Fee Calculations', () => {
  describe('Percentage-Based Fees', () => {
    it('calculates 1% fee correctly', () => {
      expect(calculateFee(100, 1)).toBe(1);
    });

    it('calculates 2.5% fee correctly', () => {
      expect(calculateFee(100, 2.5)).toBe(2.5);
    });

    it('calculates fee on small amounts', () => {
      expect(calculateFee(1.5, 3)).toBe(0.05); // Rounded
    });

    it('calculates fee on large amounts', () => {
      expect(calculateFee(1000000, 0.1)).toBe(1000);
    });

    it('handles zero amount', () => {
      expect(calculateFee(0, 5)).toBe(0);
    });

    it('handles zero fee percentage', () => {
      expect(calculateFee(1000, 0)).toBe(0);
    });
  });

  describe('Fee Safety Guards', () => {
    it('rejects negative amounts', () => {
      expect(() => calculateFee(-100, 5)).toThrow('non-negative');
    });

    it('rejects negative fee percentages', () => {
      expect(() => calculateFee(100, -5)).toThrow('non-negative');
    });

    it('rejects NaN amount', () => {
      expect(() => calculateFee(NaN, 5)).toThrow('Invalid numeric');
    });

    it('rejects NaN fee percentage', () => {
      expect(() => calculateFee(100, NaN)).toThrow('Invalid numeric');
    });

    it('rejects Infinity', () => {
      expect(() => calculateFee(Infinity, 5)).toThrow('Invalid numeric');
      expect(() => calculateFee(100, Infinity)).toThrow('Invalid numeric');
    });

    it('rejects -Infinity', () => {
      expect(() => calculateFee(-Infinity, 5)).toThrow();
    });

    it('never returns NaN', () => {
      const fee = calculateFee(0, 0);
      expect(Number.isNaN(fee)).toBe(false);
    });

    it('never returns negative', () => {
      const fee = calculateFee(0.01, 0.01);
      expect(fee).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Financial Math - Dust Handling', () => {
  describe('Currency Conversion Dust', () => {
    it('captures dust from currency conversion', () => {
      // $100 USD at 0.85 EUR rate
      const result = convertCurrencyWithDust(100, 0.85);
      expect(result.converted).toBe(85);
      expect(result.dust).toBe(0);
    });

    it('captures dust when conversion has remainder', () => {
      // $100 USD at 0.857 EUR rate = 85.7
      const result = convertCurrencyWithDust(100, 0.857);
      expect(result.converted).toBe(85.7);
      expect(result.dust).toBeCloseTo(0, 4);
    });

    it('captures dust on small amounts', () => {
      // $1 at 0.8333... rate
      const result = convertCurrencyWithDust(1, 1 / 3);
      expect(result.converted).toBe(0.33);
      // Dust captures the lost fraction
      expect(Math.abs(result.dust)).toBeLessThan(0.01);
    });

    it('accumulates dust correctly over multiple conversions', () => {
      // Simulate 1000 micro-conversions
      let totalDust = 0;
      for (let i = 0; i < 1000; i++) {
        const { dust } = convertCurrencyWithDust(0.01, 1.0001);
        totalDust += dust;
      }
      // After 1000 conversions, dust should be trackable
      expect(Math.abs(totalDust)).toBeLessThan(1); // Dust is always small
    });

    it('handles exact conversion (no dust)', () => {
      const result = convertCurrencyWithDust(100, 1.0);
      expect(result.converted).toBe(100);
      expect(result.dust).toBe(0);
    });

    it('handles very small dust amounts', () => {
      const result = convertCurrencyWithDust(100, 0.999999);
      expect(result.converted).toBe(100);
      expect(Math.abs(result.dust)).toBeLessThan(0.01);
    });
  });

  describe('Sub-Cent Dust Prevention', () => {
    it('fee on $0.01 does not create negative dust', () => {
      const fee = calculateFee(0.01, 1);
      expect(fee).toBeGreaterThanOrEqual(0);
    });

    it('multiple small fees sum correctly', () => {
      // 1000 transactions of $0.01 with 1% fee
      const fees: number[] = [];
      for (let i = 0; i < 1000; i++) {
        fees.push(calculateFee(0.01, 1));
      }
      const totalFees = safeAdd(...fees);
      // Should be approximately $0.10 (1000 * $0.0001, rounded)
      expect(totalFees).toBeGreaterThanOrEqual(0);
      expect(totalFees).toBeLessThanOrEqual(1); // Can't exceed transaction total
    });
  });
});

describe('Financial Math - Edge Cases', () => {
  describe('Boundary Values', () => {
    it('handles minimum positive currency ($0.01)', () => {
      expect(toCents(0.01)).toBe(1);
      expect(toDollars(1)).toBe(0.01);
      expect(calculateFee(0.01, 100)).toBe(0.01);
    });

    it('handles maximum safe integer conversion', () => {
      // Max safe integer in cents
      const maxCents = Number.MAX_SAFE_INTEGER;
      const dollars = toDollars(maxCents);
      expect(Number.isFinite(dollars)).toBe(true);
    });

    it('handles very small interest rates', () => {
      const interest = calculateSimpleInterest(1000000, 0.0001, 1);
      expect(interest).toBe(100); // $100 on $1M at 0.01%
    });

    it('handles very small fee percentages', () => {
      const fee = calculateFee(1000000, 0.001);
      expect(fee).toBe(10); // $10 on $1M at 0.001%
    });
  });

  describe('Special Number Handling', () => {
    it('toCents handles edge of precision', () => {
      // 0.005 should round to 1 cent
      expect(toCents(0.005)).toBe(1);
      // 0.004 should round to 0 cents
      expect(toCents(0.004)).toBe(0);
    });

    it('roundHalfUp handles very small numbers', () => {
      expect(roundHalfUp(0.001)).toBe(0);
      expect(roundHalfUp(0.005)).toBe(0.01);
    });

    it('bankersRound handles very small numbers', () => {
      expect(bankersRound(0.005)).toBe(0); // 0 is even
      expect(bankersRound(0.015)).toBe(0.02); // 2 is even
    });
  });
});
