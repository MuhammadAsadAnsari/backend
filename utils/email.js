const nodemailer = require('nodemailer');
const pug = require('pug');
const path = require('path');
const { htmlToText } = require('html-to-text'); // Correct import for v9+

class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name;
    this.url = url;
    this.from = `AM Trading <${process.env.EMAIL_FROM}>`;
  }

  // Transporter setup
  newTransport() {
    return nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use false for port 587
      auth: {
        user: 'abdullahansari.eb19102002@gmail.com',
        pass: 'rryhmqmmplntumym', // Make sure to handle sensitive data properly
      },
    });
  }

  // Send email method
  async send(template, subject, payload) {
    // Render HTML using pug template
    const html = pug.renderFile(
      path.join(__dirname, `../views/email/${template}.pug`),
      {
        firstName: this.firstName,
        url: this.url,
        subject,
        payload,
      }
    );

    // Mail options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html), // Correct conversion method
    };

    // Send the email
    await this.newTransport().sendMail(mailOptions);
  }

  // Specific function to send query email
  async sendQueryEmail() {
    await this.send('sendQueryEmail', 'A user has posted a query');
  }
}

module.exports = Email;
