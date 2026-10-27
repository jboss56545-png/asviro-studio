// Optional Vercel Serverless Endpoint: /api/contact.js
// Keeps WEB3FORMS_ACCESS_KEY in Vercel Environment Variables and adds server-side validation + rate limiting.

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 4;
const ipRequests = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const record = ipRequests.get(clientIp) || { count: 0, start: now };
  if (now - record.start > RATE_LIMIT_WINDOW_MS) {
    record.count = 0;
    record.start = now;
  }
  record.count += 1;
  ipRequests.set(clientIp, record);

  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ success: false, message: 'Too many requests. Please wait a minute and try again.' });
  }

  const { name, email, project_type, budget_range, preferred_contact, subject, message, botcheck } = req.body || {};

  if (botcheck) {
    return res.status(400).json({ success: false, message: 'Spam detected.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Valid name is required.' });
  }
  if (!email || !emailRegex.test(String(email).trim())) {
    return res.status(400).json({ success: false, message: 'Valid email address is required.' });
  }
  if (!subject || String(subject).trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Subject is required.' });
  }
  if (!message || String(message).trim().length < 10) {
    return res.status(400).json({ success: false, message: 'Project description must be at least 10 characters.' });
  }

  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    return res.status(500).json({
      success: false,
      message: 'Server environment variable WEB3FORMS_ACCESS_KEY is not configured in Vercel.'
    });
  }

  try {
    const upstream = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        name: String(name).trim(),
        email: String(email).trim(),
        project_type: project_type || 'General Enquiry',
        budget_range: budget_range || 'Not specified',
        preferred_contact: preferred_contact || 'Email',
        subject: `[ASVIRO - ${project_type || 'Enquiry'}] ${String(subject).trim()}`,
        message: String(message).trim(),
        from_name: 'ASVIRO STUDIO Website'
      })
    });

    const data = await upstream.json();
    if (upstream.ok && data.success) {
      return res.status(200).json({ success: true, message: 'Enquiry sent successfully.' });
    }
    return res.status(502).json({ success: false, message: data.message || 'Upstream email service error.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to deliver enquiry.' });
  }
}
