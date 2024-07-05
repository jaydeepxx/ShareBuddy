const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const { version } = require("../package.json");
const { connectDB } = require("./database");
const AppRouter = require("./router");
const nodemailer = require("nodemailer");
const { smtp, s3Config, s3Region, s3Bucket } = require("./config");
const _ = require("lodash");
// Amazon S3 Setup
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");
const File = require("./models/file");
const Post = require("./models/post");
const Email = require("./email");
const { Types } = require("mongoose");
const S3 = require("./s3");
const FileArchiver = require("./archiver");
const archiver = require("archiver");


AWS.config.update(s3Config);

AWS.config.region = s3Region;

const s3 = new AWS.S3();

// Setup Email
let email = nodemailer.createTransport(smtp);

// File storage config
const storageDir = path.join(__dirname, "..", "storage");

const upload = multer({
  storage: multerS3({
    s3: s3,
    // acl: "public-read",
    bucket: s3Bucket,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const filename = `${Date.now().toString()}-${file.originalname}`;
      cb(null, filename);
    },
  }),
});

const PORT = 5000;
const app = express();

app.use(morgan("dev"));
app.use(cors({ exposedHeaders: "*" }));
app.use(bodyParser.json({ limit: "50mb" }));

app.set("root", __dirname);
app.set("storageDir", storageDir);
app.upload = upload;
app.email = email;
app.s3 = s3;


connectDB()
  .then(() => {
  app.listen(process.env.PORT || PORT, () => {
  console.log(`App is running on port ${PORT}`);
});

    
  })
  .catch((error) => {
    console.log("Error connecting to the database:", error);
    process.exit(1);
  });


//routing

 app.get("/", (req, res, next) => {
   return res.status(200).json({
     version: version,
   });
 });

const uploadDir = app.get("storageDir");
  app.post("/api/upload", upload.array("files"), (req, res, next) => {
      console.log(req.files);
const files = req.files;

let fileModels = [];

files.forEach((fileObject) => {
  const newFile = new File({
    name: fileObject.key,
    originalName: fileObject.originalname,
    mimeType: fileObject.mimetype,
    size: fileObject.size,
    etag: fileObject.etag,
    url:fileObject.location,
    created: new Date(),
  });

  fileModels.push(newFile);
});

if (fileModels.length) {
  File.insertMany(fileModels)
    .then((result) => {
      const post = new Post({
        from: req.body.from,
        to: req.body.to,
        message: req.body.message,
        files: result.map((file) => file._id),
      });

      post
        .save()
        .then((result) => {
        //   const sendEmail = new Email(app).sendDownloadLink(
        //     post,
        //     (err, info) => {}
        //   );

          return res.json(fileModels[0]);
        })
        .catch((err) => {
          console.error("Error saving post:", err); // Log the error
          return res.status(503).json({
            error: { message: "Your upload could not be saved." },
          });
        });
    })
    .catch((err) => {
      console.error("Error inserting files:", err); // Log the error
      return res.status(503).json({
        error: {
          message: "Unable to save your files.",
        },
      });
    });
} else {
  return res.status(503).json({
    error: { message: "Files upload is required." },
  });
}
 });


async function getPostById(id) {
  try {
    const post = await Post.findById(id);

    if (!post) {
      throw new Error("File not found.");
    }

    const fileIds = post.files || [];

    const files = await File.find({ _id: { $in: fileIds } });

    if (!files || files.length === 0) {
      throw new Error("File not found.");
    }

    post.files = files;

    return post;
  } catch (err) {
    throw err;
  }
}


//  app.get("/api/download/:id", async (req, res, next) => {
//    const fileId = req.params.id;

//    try {
//      const file = await File.findById(fileId);

//      if (!file) {
//        return res.status(404).json({
//          error: {
//            message: "File not found.",
//          },
//        });
//      }
//      const filename = file.name;
//      donwloadMe(filename);
//     //  let x = await s3
//     //    .getObject({ Bucket: process.env.BUCKET, Key: filename })
//     //    .promise();
//     //  res.send(x.Body);
//     //  res.send(filename);
//     //  const downloader = new S3(app.s3, res);
//     //  const downloadUrl = downloader.getDownloadUrl(file);

//     //  return res.redirect(downloadUrl);
//     //    return res.json({
//     //      message: "File found.",
//     //      downloadUrl: downloadUrl,
//     //    });
//    } catch (error) {
//      console.error("Error retrieving file:", error);
//      return res.status(500).json({
//        error: {
//          message: "Unable to download the file.",
//        },
//      });
//    }
//  });


app.get(`/api/download/:filename`, async function (req, res) {
    
  try {
    const filename = req.params.filename;
    let x = await s3
      .getObject({ Bucket: process.env.BUCKET, Key: filename })
      .promise();
    res.send(x.Body);
  } catch (error) {
    res.send("File maybe deleted or not found in bucket")
  }


    
  });



app.get("/api/posts/:id", async (req, res, next) => {
  const postId = req.params.id;

  try {
    // Use Mongoose to find the post by ID
    const post = await File.findById(postId);

    if (!post) {
      return res.status(404).json({ error: { message: "File not found." } });
    }

    return res.json(post);
  } catch (err) {
    return res
      .status(500)
      .json({ error: { message: "Internal server error." } });
  }
});


app.get("/api/posts/:id/download", async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await getPostById(id);

    if (!result) {
      return res.status(404).json({ error: { message: "File not found." } });
    }

    const files = result.files || [];
    const archiver = new FileArchiver(app, files, res);
    archiver.download();
  } catch (err) {
    return res
      .status(500)
      .json({ error: { message: "Internal server error." } });
  }
});

module.exports = app;

