const { ObjectID } = require("mongodb");
const _ = require("lodash");

const Auth = function (app) {
  const createToken = function (user, expire = null, cb = () => {}) {
    let model = this.model;
    const db = this.app.db;

    model.userId = user._id;
    model.expire = expire;

    db.collection("tokens").insertOne(model, (err, token) => {
      return cb(err, model);
    });
  };

  const checkAuth = function (req, cb = () => {}) {
    const token = req.get("authorization");

    if (!token) {
      return cb(false);
    }

    const db = this.app.db;
    const query = {
      _id: new ObjectID(token),
    };
    db.collection("tokens")
      .find(query)
      .limit(1)
      .toArray((err, tokenObjects) => {
        const tokenObj = _.get(tokenObjects, "[0]", null);

        if (err === null && tokenObj) {
          return cb(true);
        }

        return cb(false);
      });
  };

  const model = {
    userId: null,
    expire: null,
  };

  return { model, createToken, checkAuth };
};

module.exports = Auth;
