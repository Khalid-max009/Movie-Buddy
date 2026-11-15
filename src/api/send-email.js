export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Missing email or name' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'MovieBuddy Team <onboarding@resend.dev>',
        to: [email],
        subject: `Welcome to MovieBuddy, ${name}!`,
        html: `
          <h2>Hello ${name},</h2>
          <p>Welcome to MovieBuddy! We are thrilled to have you onboard. Your account is now active, allowing you to seamlessly track your personal watchlist, save your favorite films, and explore custom recommendations.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <h3>💻 Built by Kazeem Khalid</h3>
          <p>MovieBuddy is a high-performance web application engineered and designed by <strong>Kazeem Khalid</strong>, a professional frontend and full-stack web developer dedicated to building responsive, feature-rich, and user-centric digital experiences.</p>
          <p>If you have any feedback, project inquiries, or would like to collaborate, let's connect:</p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:khalidolaonipekun43@gmail.com">khalidolaonipekun43@gmail.com</a></li>
            <li><strong>WhatsApp:</strong> <a href="https://wa.me/2349063990709" target="_blank">Chat with me on WhatsApp</a></li>
          </ul>
        `,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email via Resend');
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}