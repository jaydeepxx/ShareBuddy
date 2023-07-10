const { s3Bucket } = require("./config");


const S3 = function (app, response) {
  const getObject = function (files) {
    const s3 = app.s3;

    const options = {
      Bucket: s3Bucket,
      Key: files.name,
    };

    return s3.getObject(options).createReadStream();
  };

  const download = function (files) {
    const s3 = app.s3;
    const res = response;

    const filename = files.originalName;
    res.attachment(filename);

    const options = {
      Bucket: s3Bucket,
      Key: files.name,
    };

    const fileObject = s3.getObject(options).createReadStream();
    fileObject.pipe(res);
  };

  const getDownloadUrl = async function (files) {
    const s3 = app.s3;
    const options = {
      Bucket: s3Bucket,
      Key: files.name,
      Expires: 3600, // one hour expires.
    };

    const url = await getSignedUrl(s3, { expiresIn: 3600 });
    return url;
  };

  return { getObject, download, getDownloadUrl };
};

module.exports = S3;
