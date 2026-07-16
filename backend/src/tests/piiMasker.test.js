/**
 * PII Masker Unit Tests
 * Tests all masking functions with exact format assertions
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests_only';
process.env.COOKIE_NAME = 'hdfc_test_token';

const {
  maskAadhaar,
  maskPan,
  maskMobile,
  maskCustomerPII,
  maskCustomerListPII,
} = require('../utils/piiMasker');

describe('PII Masking Utilities', () => {
  // ── Aadhaar Masking ────────────────────────────────────────────────────
  describe('maskAadhaar()', () => {
    it('should mask Aadhaar showing only last 4 digits with dashes', () => {
      expect(maskAadhaar('123456789012')).toBe('XXXX-XXXX-9012');
    });

    it('should show the correct last 4 digits for any Aadhaar', () => {
      expect(maskAadhaar('987654321098')).toBe('XXXX-XXXX-1098');
      expect(maskAadhaar('111122223333')).toBe('XXXX-XXXX-3333');
    });

    it('should return the original value if Aadhaar is invalid length', () => {
      expect(maskAadhaar('12345')).toBe('12345');
      expect(maskAadhaar(null)).toBeNull();
      expect(maskAadhaar(undefined)).toBeUndefined();
    });

    it('should handle all-zero Aadhaar', () => {
      expect(maskAadhaar('000000000000')).toBe('XXXX-XXXX-0000');
    });
  });

  // ── PAN Masking ────────────────────────────────────────────────────────
  describe('maskPan()', () => {
    it('should mask PAN showing first 3, middle 2 digits, and last 1 char', () => {
      // Input: ABCDE1234F => first3=ABC, pos3-4=XX, pos5-6=12, pos7-8=XX, pos9=F
      expect(maskPan('ABCDE1234F')).toBe('ABCXX12XXF');
    });

    it('should correctly mask different PAN numbers', () => {
      expect(maskPan('PQRST5678Z')).toBe('PQRXX56XXZ');
      expect(maskPan('ZZZZZ9999Z')).toBe('ZZZXX99XXZ');
    });

    it('should return original if PAN is invalid length', () => {
      expect(maskPan('ABCD')).toBe('ABCD');
      expect(maskPan(null)).toBeNull();
      expect(maskPan('')).toBe('');
    });
  });

  // ── Mobile Masking ─────────────────────────────────────────────────────
  describe('maskMobile()', () => {
    it('should mask mobile showing first 2 and last 2 digits', () => {
      expect(maskMobile('9876543210')).toBe('98XXXXXX10');
    });

    it('should correctly mask different mobile numbers', () => {
      expect(maskMobile('7012345678')).toBe('70XXXXXX78');
      expect(maskMobile('6999999900')).toBe('69XXXXXX00');
    });

    it('should return original if mobile is invalid length', () => {
      expect(maskMobile('98765')).toBe('98765');
      expect(maskMobile(null)).toBeNull();
    });
  });

  // ── maskCustomerPII ────────────────────────────────────────────────────
  describe('maskCustomerPII()', () => {
    const rawCustomer = {
      _id: 'abc123',
      firstName: 'Ravi',
      lastName: 'Kumar',
      email: 'ravi@example.com',
      mobile: '9876543210',
      aadhaar: '123456789012',
      pan: 'ABCDE1234F',
    };

    it('should mask all PII fields in a customer object', () => {
      const masked = maskCustomerPII(rawCustomer);
      expect(masked.aadhaar).toBe('XXXX-XXXX-9012');
      expect(masked.pan).toBe('ABCXX12XXF');
      expect(masked.mobile).toBe('98XXXXXX10');
    });

    it('should preserve non-PII fields unchanged', () => {
      const masked = maskCustomerPII(rawCustomer);
      expect(masked.firstName).toBe('Ravi');
      expect(masked.lastName).toBe('Kumar');
      expect(masked.email).toBe('ravi@example.com');
      expect(masked._id).toBe('abc123');
    });

    it('should handle null customer gracefully', () => {
      expect(maskCustomerPII(null)).toBeNull();
    });

    it('should handle missing PAN (optional field) gracefully', () => {
      const customerNoPan = { ...rawCustomer, pan: null };
      const masked = maskCustomerPII(customerNoPan);
      expect(masked.pan).toBeNull();
      expect(masked.aadhaar).toBe('XXXX-XXXX-9012');
    });
  });

  // ── maskCustomerListPII ────────────────────────────────────────────────
  describe('maskCustomerListPII()', () => {
    it('should mask PII for all customers in an array', () => {
      const customers = [
        { mobile: '9876543210', aadhaar: '123456789012', pan: 'ABCDE1234F' },
        { mobile: '7011112222', aadhaar: '987600001234', pan: 'XYZPQ1234R' },
      ];
      const masked = maskCustomerListPII(customers);
      expect(masked[0].mobile).toBe('98XXXXXX10');
      expect(masked[0].aadhaar).toBe('XXXX-XXXX-9012');
      expect(masked[1].mobile).toBe('70XXXXXX22');
    });

    it('should return original if input is not an array', () => {
      expect(maskCustomerListPII(null)).toBeNull();
      expect(maskCustomerListPII('string')).toBe('string');
    });

    it('should handle an empty array', () => {
      expect(maskCustomerListPII([])).toEqual([]);
    });
  });
});
