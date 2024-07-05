const dotenv = require("dotenv");
// const { accessKeyId, secretAccessKey } = require("./s3-config.json");
dotenv.config();

module.exports.smtp = {
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "apikey", // generated ethereal user
    pass: "SendGridApiKey", // generated ethereal password
  },
};

module.exports.url = "http://localhost:3000";

module.exports.s3Config = {
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
};

module.exports.s3Region = "ap-south-1";
module.exports.s3Bucket = "iiita-classroom";
