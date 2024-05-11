const nodemailer = require('nodemailer');
const pug = require('pug');
const {htmlToText} = require('html-to-text');

class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `The Coper <${process.env.EMAIL_FROM}>`
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            //sendgrid
            return 1;
        } 

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    async send(template, subject) {
        // render HTML based on pug
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        })

        // define email options
        const emailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText(html)
            // html
        }

        // create transport and send email
        await this.newTransport().sendMail(emailOptions);
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours!')
    }

    async sendPasswordReset() {
        await this.send('resetPassword', 'Your password reset token valid for 10mins')
    }
};

module.exports = Email;