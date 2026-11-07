// Brevo Transactional Email Service Integration

const sendTransactionalEmail = async ({ toEmail, toName, subject, htmlContent }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'rahulyo954030@gmail.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'FeeOrbit';

  if (!apiKey || apiKey.startsWith('xkeysib-your')) {
    console.log(`[Brevo Email Mock] To: ${toEmail} | Subject: ${subject}`);
    return { success: true, mocked: true };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: toEmail,
            name: toName || toEmail,
          },
        ],
        subject,
        htmlContent,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`[Brevo Email Sent] MessageId: ${data.messageId} to ${toEmail}`);
      return { success: true, messageId: data.messageId };
    } else {
      console.error('[Brevo Email Error]', data);
      return { success: false, error: data };
    }
  } catch (err) {
    console.error('[Brevo Email Request Exception]', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * 6-Digit Email Verification Code Template
 */
const sendVerificationOtpEmail = async ({ toEmail, toName, otpCode }) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your FeeOrbit Account</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #070a13; color: #f1f5f9; margin: 0; padding: 0; }
        .container { max-width: 520px; margin: 30px auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #6366f1, #06b6d4); padding: 28px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 26px; color: #ffffff; letter-spacing: -0.5px; font-weight: 800; }
        .body { padding: 32px 28px; text-align: center; }
        .body h2 { color: #ffffff; font-size: 20px; margin-top: 0; }
        .body p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 12px 0; }
        .otp-box { display: inline-block; background: #1e1b4b; border: 2px dashed #6366f1; border-radius: 12px; padding: 16px 36px; margin: 24px 0; letter-spacing: 12px; font-size: 32px; font-weight: 800; color: #38bdf8; font-family: monospace; }
        .footer { border-top: 1px solid #1e293b; padding: 18px; text-align: center; font-size: 12px; color: #64748b; background: #090d16; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FeeOrbit</h1>
          <div style="font-size: 13px; color: rgba(255,255,255,0.85); margin-top: 4px;">Gym Operating System</div>
        </div>
        <div class="body">
          <h2>Verify Your Email Address</h2>
          <p>Hello <strong>${toName || 'Gym Admin'}</strong>,</p>
          <p>Welcome to FeeOrbit! Please use the 6-digit verification code below to activate your Admin workspace account:</p>
          <div class="otp-box">${otpCode}</div>
          <p style="font-size: 13px; color: #64748b;">This verification code will expire in <strong>15 minutes</strong>. If you did not create this account, please ignore this email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} FeeOrbit Platform • All Rights Reserved
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendTransactionalEmail({
    toEmail,
    toName,
    subject: `${otpCode} is your FeeOrbit Verification Code`,
    htmlContent,
  });
};

/**
 * Staff / Trainer Invitation Email
 */
const sendStaffInviteEmail = async ({ toEmail, toName, gymName, role, temporaryPassword, loginUrl }) => {
  const portalUrl = loginUrl || 'http://localhost:3000/login';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Staff Invitation - FeeOrbit</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #070a13; color: #f1f5f9; margin: 0; padding: 0; }
        .container { max-width: 520px; margin: 30px auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #6366f1, #3b82f6); padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; color: #ffffff; }
        .body { padding: 30px 24px; }
        .credentials { background: #1e293b; border-radius: 10px; padding: 18px; margin: 20px 0; font-size: 14px; }
        .button { display: inline-block; background: #6366f1; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px; }
        .footer { padding: 16px; text-align: center; font-size: 12px; color: #64748b; background: #090d16; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FeeOrbit</h1>
          <div style="font-size: 13px; color: #e0e7ff;">Staff Portal Access</div>
        </div>
        <div class="body">
          <h2 style="color:#ffffff; margin-top:0;">Welcome to the Team, ${toName}!</h2>
          <p style="color:#94a3b8;">You have been invited by the Admin as <strong>${role || 'Staff'}</strong> for <strong>${gymName}</strong>.</p>
          <div class="credentials">
            <div style="margin-bottom:8px;"><strong>Workspace:</strong> ${gymName}</div>
            <div style="margin-bottom:8px;"><strong>Role:</strong> Staff / Trainer</div>
            <div style="margin-bottom:8px;"><strong>Login Email:</strong> ${toEmail}</div>
            <div><strong>Temporary Password:</strong> <span style="font-family:monospace; color:#38bdf8; font-weight:bold;">${temporaryPassword}</span></div>
          </div>
          <div style="text-align:center;">
            <a href="${portalUrl}" class="button">Log In to Staff Workspace &rarr;</a>
          </div>
        </div>
        <div class="footer">&copy; ${new Date().getFullYear()} FeeOrbit • ${gymName}</div>
      </div>
    </body>
    </html>
  `;

  return await sendTransactionalEmail({
    toEmail,
    toName,
    subject: `Welcome to ${gymName}! Your Staff Account Credentials`,
    htmlContent,
  });
};

/**
 * Member Onboarding & Welcome Invite Email
 */
const sendMemberWelcomeInviteEmail = async ({ toEmail, toName, gymName, memberId, planName, temporaryPassword, loginUrl }) => {
  const portalUrl = loginUrl || 'http://localhost:3000/login';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to ${gymName}</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #070a13; color: #f1f5f9; margin: 0; padding: 0; }
        .container { max-width: 520px; margin: 30px auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #10b981, #06b6d4); padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; color: #ffffff; }
        .body { padding: 30px 24px; }
        .card { background: #1e293b; border-radius: 10px; padding: 18px; margin: 20px 0; font-size: 14px; }
        .button { display: inline-block; background: #10b981; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px; }
        .footer { padding: 16px; text-align: center; font-size: 12px; color: #64748b; background: #090d16; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${gymName}</h1>
          <div style="font-size: 13px; color: #ecfdf5;">Digital Member Portal</div>
        </div>
        <div class="body">
          <h2 style="color:#ffffff; margin-top:0;">Welcome, ${toName}!</h2>
          <p style="color:#94a3b8;">Your gym membership at <strong>${gymName}</strong> is officially active. You can access your Live Digital QR Pass, workout routines, and payment invoices directly on your Member Portal.</p>
          <div class="card">
            <div style="margin-bottom:8px;"><strong>Member ID:</strong> <span style="font-family:monospace; color:#34d399; font-weight:bold;">${memberId}</span></div>
            <div style="margin-bottom:8px;"><strong>Plan:</strong> ${planName || 'Gym Membership'}</div>
            <div style="margin-bottom:8px;"><strong>Login Email:</strong> ${toEmail}</div>
            <div><strong>Initial Password:</strong> <span style="font-family:monospace; color:#38bdf8; font-weight:bold;">${temporaryPassword}</span></div>
          </div>
          <div style="text-align:center;">
            <a href="${portalUrl}" class="button">Access Member Portal & Pass &rarr;</a>
          </div>
        </div>
        <div class="footer">&copy; ${new Date().getFullYear()} ${gymName} • Powered by FeeOrbit</div>
      </div>
    </body>
    </html>
  `;

  return await sendTransactionalEmail({
    toEmail,
    toName,
    subject: `Welcome to ${gymName}! Your Member ID & Portal Access`,
    htmlContent,
  });
};

/**
 * Payment Due Reminder Email Template
 */
const sendPaymentReminderEmail = async ({
  toEmail,
  toName,
  gymName,
  planName,
  dueAmount,
  dueDate,
  receiptNumber,
  upiId,
  currencySymbol = '₹',
}) => {
  const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) : 'Immediate';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Due Reminder - ${gymName}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 24px; color: #f8fafc; }
        .container { max-width: 540px; margin: 0 auto; background: #111827; border-radius: 12px; overflow: hidden; border: 1px solid #1f2937; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 28px 24px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0 0; color: #fef3c7; font-size: 13px; font-weight: 500; }
        .body { padding: 28px 24px; }
        .due-box { background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
        .due-amount { font-size: 32px; font-weight: 800; color: #fbbf24; margin: 6px 0; }
        .due-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600; }
        .details-grid { background: #1f2937; border-radius: 8px; padding: 14px 18px; margin: 18px 0; font-size: 13px; }
        .details-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .details-row:last-child { border-bottom: none; }
        .details-label { color: #94a3b8; }
        .details-value { color: #ffffff; font-weight: 600; }
        .upi-box { background: rgba(99, 102, 241, 0.12); border: 1px dashed rgba(99, 102, 241, 0.4); border-radius: 8px; padding: 12px 16px; margin: 18px 0; text-align: center; font-size: 13px; color: #c7d2fe; }
        .footer { background: #0b0f19; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1f2937; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${gymName}</h1>
          <p>Official Fee Balance Reminder</p>
        </div>
        <div class="body">
          <p style="font-size: 15px; margin-top: 0; color: #e2e8f0;">Dear <strong>${toName}</strong>,</p>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
            This is a friendly reminder regarding your pending membership balance at <strong>${gymName}</strong>. Please clear your outstanding amount to continue enjoying uninterrupted access to gym facilities.
          </p>

          <div class="due-box">
            <div class="due-label">Outstanding Balance Due</div>
            <div class="due-amount">${currencySymbol}${Number(dueAmount).toLocaleString('en-IN')}</div>
            <div style="font-size: 12px; color: #f59e0b; font-weight: 600;">Due Date: ${formattedDueDate}</div>
          </div>

          <div class="details-grid">
            <div class="details-row">
              <span class="details-label">Member Name</span>
              <span class="details-value">${toName}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Membership Plan</span>
              <span class="details-value">${planName || 'Gym Plan'}</span>
            </div>
            ${receiptNumber ? `
            <div class="details-row">
              <span class="details-label">Reference Receipt</span>
              <span class="details-value">${receiptNumber}</span>
            </div>` : ''}
          </div>

          ${upiId ? `
          <div class="upi-box">
            💳 <strong>Direct UPI Payment ID:</strong><br>
            <span style="font-family: monospace; font-size: 14px; font-weight: bold; color: #ffffff;">${upiId}</span>
            <div style="font-size: 11px; color: #a5b4fc; margin-top: 4px;">Pay via GPay, PhonePe, Paytm, or BHIM</div>
          </div>
          ` : ''}

          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
            You may also clear this balance at the gym reception desk via Cash or Card. If you have already made the payment, please disregard this reminder.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ${gymName} • Generated via FeeOrbit Gym Platform
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendTransactionalEmail({
    toEmail,
    toName,
    subject: `Friendly Payment Reminder: ${currencySymbol}${Number(dueAmount).toLocaleString('en-IN')} due for ${gymName}`,
    htmlContent,
  });
};

module.exports = {
  sendTransactionalEmail,
  sendVerificationOtpEmail,
  sendStaffInviteEmail,
  sendMemberWelcomeInviteEmail,
  sendPaymentReminderEmail,
};
