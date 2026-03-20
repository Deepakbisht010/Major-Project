import nodemailer from 'nodemailer';

// Configuration for sending emails using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'deepakbisht4050@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD // User must generate an App Password in Gmail Settings
    }
});

export const sendHelpEmail = async (helpData) => {
    const { name, email, mobile, message } = helpData;

    const mailOptions = {
        from: `"e-Taxpay Support" <${process.env.EMAIL_USER || 'deepakbisht4050@gmail.com'}>`,
        to: 'deepakbisht4050@gmail.com', // Always send to you
        subject: `New Help Request from ${name}`,
        html: `
      <h2>New Support Request (Need Help)</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Mobile:</strong> ${mobile}</p>
      <p><strong>Message:</strong></p>
      <p style="padding: 10px; background: #f4f4f4; border-radius: 5px;">${message}</p>
      <hr />
      <p>Sent via e-Taxpay Citizen Portal</p>
    `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('[Mailer] Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[Mailer] Error sending email:', error);
        throw error;
    }
};
