// Pre-allocate lookup once (32 chars)
const SF18_LOOKUP = "ABCDEFGHIJKLMNOPQRSTUVWXYZ012345";

/**
 * Ultra-fast validator for Salesforce 18-char Ids.
 * - No regex or substring allocations
 * - Single pass on the first 15 chars to build bitmasks
 * - Direct char-by-char compare for checksum (no string concat)
 *
 * Returns true only if: length==18, all chars are alphanumeric,
 * and the computed checksum matches the last 3 chars.
 */
export function isValidSalesforce18IdFast(id: string): boolean {
  // Quick length guard
  if (id.length !== 18) return false;

  let m0 = 0, m1 = 0, m2 = 0;

  // Validate and process the first 15 chars
  for (let i = 0; i < 15; i++) {
    const c = id.charCodeAt(i);

    // isAlnum: 0-9 / A-Z / a-z
    // '0'..'9' => 48..57, 'A'..'Z' => 65..90, 'a'..'z' => 97..122
    const isDigit  = c >= 48 && c <= 57;
    const isUpper  = c >= 65 && c <= 90;
    const isLower  = c >= 97 && c <= 122;
    if (!(isDigit || isUpper || isLower)) return false;

    // Build bitmasks only for UPPERCASE letters
    if (isUpper) {
      // chunk = floor(i/5), pos = i % 5 (use subtraction to avoid modulus cost)
      const chunk = (i / 5) | 0;          // 0,1,2
      const pos   = i - chunk * 5;        // 0..4
      const bit   = 1 << pos;

      if (chunk === 0) m0 |= bit;
      else if (chunk === 1) m1 |= bit;
      else m2 |= bit; // chunk === 2
    }
  }

  // Compute expected checksum chars
  const e0 = SF18_LOOKUP.charCodeAt(m0); // 0..31
  const e1 = SF18_LOOKUP.charCodeAt(m1);
  const e2 = SF18_LOOKUP.charCodeAt(m2);

  // Fast compare against characters 15..17 (no slice/concat)
  // Optional: ensure last 3 are alnum (kept implicit—mismatch will fail anyway)
  return (
    id.charCodeAt(15) === e0 &&
    id.charCodeAt(16) === e1 &&
    id.charCodeAt(17) === e2 &&
    // Also ensure the last 3 are alnum to match the original "regex + checksum" intent:
    isAlnumCode(id.charCodeAt(15)) &&
    isAlnumCode(id.charCodeAt(16)) &&
    isAlnumCode(id.charCodeAt(17))
  );
}

// Tiny helper (inlined logic from above) to mirror the original regex guarantee.
function isAlnumCode(c: number): boolean {
  return (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
}
