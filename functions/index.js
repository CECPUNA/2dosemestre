const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();

const DEFAULT_TOPIC = 'all';

// POST { token, topic? } — suscribe un token al topic
exports.subscribeTopic = onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'method-not-allowed' });
    }
    const { token, topic = DEFAULT_TOPIC } = req.body || {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ ok: false, error: 'missing-token' });
    }
    try {
      const result = await admin.messaging().subscribeToTopic([token], topic);
      return res.json({
        ok: true,
        topic,
        successCount: result.successCount,
        failureCount: result.failureCount
      });
    } catch (error) {
      logger.error('subscribeTopic', error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  });
});

// POST { password, title, body, topic?, url? } — envia notificacion a todos
exports.sendTopic = onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'method-not-allowed' });
    }
    const adminPassword = process.env.ADMIN_PUSH_PASSWORD;
    const { password, title, body, topic = DEFAULT_TOPIC, url = '/' } = req.body || {};
    if (!adminPassword || password !== adminPassword) {
      return res.status(403).json({ ok: false, error: 'forbidden' });
    }
    if (!title || !body) {
      return res.status(400).json({ ok: false, error: 'missing-title-body' });
    }
    try {
      const id = await admin.messaging().send({
        topic,
        notification: { title, body },
        webpush: {
          fcmOptions: { link: url },
          notification: { icon: '/img/icon-192.png' }
        }
      });
      return res.json({ ok: true, id });
    } catch (error) {
      logger.error('sendTopic', error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  });
});
