const mongoose = require("mongoose");
require("dotenv").config();

module.exports.connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useFindAndModify: true,
    });

    console.log("MongoDB Connected");
  } catch (error) {
    console.log("Error");
    process.exit();
  }
};
