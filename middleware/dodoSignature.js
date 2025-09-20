/**
 * Dodo Webhook Signature Verification Middleware
 *
 * Purpose:
 * - Verifies that incoming webhook requests are sent by Dodo Payments using a shared secret
 * - Uses HMAC-SHA256 over the raw request body and compares against 'x-dodo-signature'
 *
 * Configuration:
 * - Set DODO_SIGNATURE_VERIFY=true to enable verification
 * - Set DODO_WEBHOOK_SECRET=<your_webhook_signing_key>
 *
 * Express body parsing note:
 * - This middleware requires access to the raw request body. In the webhook route,
 *   use bodyParser.raw({ type: 'application/json' }) BEFORE this middleware.
 *
 * Behavior:
 * - If verification is enabled and fails, responds 401 immediately
 * - If disabled (default), it skips verification and calls next()
 */
const crypto = require('crypto');

function timingSafeEqual(a, b) {
    try {
        const b1 = Buffer.from(a);
        const b2 = Buffer.from(b);
        return b1.length === b2.length && crypto.timingSafeEqual(b1, b2);
    } catch (_) {
        return false;
    }
}

module.exports = function dodoSignature(req, res, next) {
    if (process.env.DODO_SIGNATURE_VERIFY !== 'true') {
        return next();
    }

    const secret = process.env.DODO_WEBHOOK_SECRET;
    if (!secret) {
        return res.status(500).send('Webhook signing secret not configured');
    }

    const signatureHeader = req.header('x-dodo-signature');
    if (!signatureHeader) {
        return res.status(401).send('Missing signature header');
    }

    // Expect raw body (Buffer)
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
    const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    if (!timingSafeEqual(computed, signatureHeader)) {
        return res.status(401).send('Invalid signature');
    }

    return next();
};
