/**
 * PII Masking Utility
 * Enterprise-grade data masking for Aadhaar, PAN, and Mobile numbers
 * Conforms to Section 7 of HDFC Life Assignment Specification
 *
 * Masking Rules:
 *   Aadhaar : XXXX-XXXX-9012  (last 4 digits shown with dashes)
 *   PAN     : ABCXX12XXF      (first 3 + last 1 shown, middle masked)
 *   Mobile  : 98XXXXXX10      (first 2 + last 2 shown, middle masked)
 */

/**
 * Masks an Aadhaar number
 * Input : "123456789012"  => "XXXX-XXXX-9012"
 * @param {string} aadhaar
 * @returns {string}
 */
const maskAadhaar = (aadhaar) => {
  if (!aadhaar || aadhaar.length !== 12) return aadhaar;
  const last4 = aadhaar.slice(-4);
  return `XXXX-XXXX-${last4}`;
};

/**
 * Masks a PAN card number
 * Input : "ABCDE1234F"  => "ABCXX12XXF"
 * Rule  : Show first 3 chars + last 1 char; mask positions 4,5 and 8,9
 * @param {string} pan
 * @returns {string}
 */
const maskPan = (pan) => {
  if (!pan || pan.length !== 10) return pan;
  // Positions (0-indexed): 0,1,2 visible | 3,4 masked | 5,6 visible | 7,8 masked | 9 visible
  return `${pan.slice(0, 3)}XX${pan.slice(5, 7)}XX${pan.slice(9)}`;
};

/**
 * Masks a mobile number
 * Input : "9876543210"  => "98XXXXXX10"
 * Rule  : Show first 2 + last 2; mask middle 6
 * @param {string} mobile
 * @returns {string}
 */
const maskMobile = (mobile) => {
  if (!mobile || mobile.length !== 10) return mobile;
  return `${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)}`;
};

/**
 * Applies PII masking to a customer object (plain JS object, not Mongoose doc)
 * @param {Object} customer - Plain customer object
 * @returns {Object} - Customer with masked PII fields
 */
const maskCustomerPII = (customer) => {
  if (!customer) return customer;

  const masked = { ...customer };

  if (masked.aadhaar) masked.aadhaar = maskAadhaar(masked.aadhaar);
  if (masked.pan) masked.pan = maskPan(masked.pan);
  if (masked.mobile) masked.mobile = maskMobile(masked.mobile);

  return masked;
};

/**
 * Applies PII masking to an array of customer objects
 * @param {Array} customers
 * @returns {Array}
 */
const maskCustomerListPII = (customers) => {
  if (!Array.isArray(customers)) return customers;
  return customers.map(maskCustomerPII);
};

module.exports = {
  maskAadhaar,
  maskPan,
  maskMobile,
  maskCustomerPII,
  maskCustomerListPII,
};
