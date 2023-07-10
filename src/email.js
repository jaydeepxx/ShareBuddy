const _ = require("lodash");
const { url } = require("./config");

const Email = function (app) {
  const sendDownloadLink = function (post, callback = () => {}) {
    const app = this.app;
    const email = app.email;

    const from = _.get(post, "from");
    const to = _.get(post, "to");
    const message = _.get(post, "message", "");
    const postId = _.get(post, "_id");
    const downloadLink = `${url}/share/${postId}`;

    let messageOptions = {
      from: from,
      to: to,
      subject: "[Share] Download Invitation",
      text: message,
      html: `<p>${from} has sent to you a file. Click <a href="${downloadLink}">here</a> to download.</p><p>Message: ${message}</p>`,
    };

    email.sendMail(messageOptions, (error, info) => {
      console.log("Sending an email with callback", error, info);

      return callback(error, info);
    });
  };

  return { sendDownloadLink };
};

module.exports = Email;
