const archiver = require("archiver");
const path = require("path");
const S3 = require("./s3");

const FileArchiver = function (app, files = [], response) {
  const download = function () {
    const zip = archiver("zip");
    const res = this.response;

    res.attachment("download.zip");
    zip.pipe(res);

    const s3Downloader = new S3(app, res);

    files.forEach((file) => {
      const fileObject = s3Downloader.getObject(file);
      zip.append(fileObject, { name: file.originalName });
      /*const filePath = path.join(uploadDir, file.name);
      zip.file(filePath, { name: file.originalName });*/
    });

    zip.finalize();

    return this;
  };

  return { download };
};

module.exports = FileArchiver;
