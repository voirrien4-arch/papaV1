// Gold_Crew — TOTP (Time-based One-Time Password) Implementation
// Uses Web Crypto API for HMAC-SHA1 — no external libraries needed
const TOTP = (() => {
  const DIGITS = 6;
  const PERIOD = 30;       // seconds per code
  const WINDOW = 1;        // ±1 step tolerance for clock skew
  const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

  // ── Secret Generation ──────────────────────────────
  function generateSecret(byteLength = 20) {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    return base32Encode(bytes);
  }

  // ── Base32 Encode ──────────────────────────────────
  function base32Encode(bytes) {
    let bits = '';
    for (const b of bytes) bits += b.toString(2).padStart(8, '0');
    let result = '';
    for (let i = 0; i < bits.length; i += 5) {
      const chunk = bits.slice(i, i + 5).padEnd(5, '0');
      result += BASE32[parseInt(chunk, 2)];
    }
    return result;
  }

  // ── Base32 Decode ──────────────────────────────────
  function base32Decode(str) {
    let bits = '';
    for (const ch of str.toUpperCase().replace(/[^A-Z2-7]/g, '')) {
      const val = BASE32.indexOf(ch);
      if (val >= 0) bits += val.toString(2).padStart(5, '0');
    }
    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
    }
    return bytes;
  }

  // ── HMAC-SHA1 via Web Crypto ───────────────────────
  async function hmacSha1(keyBytes, dataBytes) {
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes);
    return new Uint8Array(sig);
  }

  // ── Int → 8-byte big-endian ────────────────────────
  function intToBytes(num) {
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    view.setUint32(0, Math.floor(num / 0x100000000));
    view.setUint32(4, num >>> 0);
    return new Uint8Array(buf);
  }

  // ── Generate a 6-digit code for a given time step ──
  async function generateCode(secret, timeStep) {
    const keyBytes = base32Decode(secret);
    const timeBytes = intToBytes(timeStep);
    const hash = await hmacSha1(keyBytes, timeBytes);
    const offset = hash[hash.length - 1] & 0x0F;
    const binary = (
      ((hash[offset] & 0x7F) << 24) |
      ((hash[offset + 1] & 0xFF) << 16) |
      ((hash[offset + 2] & 0xFF) << 8) |
      (hash[offset + 3] & 0xFF)
    ) % Math.pow(10, DIGITS);
    return binary.toString().padStart(DIGITS, '0');
  }

  // ── Current time step ──────────────────────────────
  function getTimeStep() {
    return Math.floor(Date.now() / 1000 / PERIOD);
  }

  // ── Verify a user-entered code ─────────────────────
  // Checks current step ± WINDOW for clock skew tolerance
  async function verify(secret, code) {
    const normalized = code.toString().replace(/\D/g, '').padStart(DIGITS, '0');
    const currentStep = getTimeStep();
    for (let i = -WINDOW; i <= WINDOW; i++) {
      const expected = await generateCode(secret, currentStep + i);
      if (expected === normalized) return true;
    }
    return false;
  }

  // ── Generate current code (for setup verification) ─
  async function currentCode(secret) {
    return generateCode(secret, getTimeStep());
  }

  // ── otpauth:// URL for authenticator apps ──────────
  function getOtpauthUrl(secret, email, issuer) {
    issuer = issuer || 'Gold_Crew';
    return 'otpauth://totp/' + encodeURIComponent(issuer + ':' + email)
      + '?secret=' + secret
      + '&issuer=' + encodeURIComponent(issuer)
      + '&digits=' + DIGITS
      + '&period=' + PERIOD;
  }

  // ── Format secret in groups for display ────────────
  function formatSecret(secret) {
    return secret.match(/.{1,4}/g).join(' ');
  }

  return { generateSecret, verify, currentCode, getTimeStep, getOtpauthUrl, formatSecret };
})();

window.GCTOTP = TOTP;
