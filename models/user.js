const _ = require("lodash");
const bcrypt = require("bcrypt");
const Auth = require("./auth");
const { ObjectID } = require("mongodb");

const saltRounds = 10;

const User = function (app) {
  const findById = function (id = null, cb = () => {}) {
    const db = this.app.db;

    const query = {
      _id: new ObjectID(id),
    };

    db.collection("users")
      .find(query)
      .limit(1)
      .toArray((err, result) => {
        const user = _.get(result, "[0]");
        if (err === null && user) {
          delete user.password;
          return cb(null, user);
        }

        const error = { message: "User not found." };
        return cb(error, null);
      });
  };

  const login = function (email, password, callback = () => {}) {
    const app = this.app;

    let error = null;
    let user = { name: "A", email: "test@gmail.com" };

    console.log("Email: ", email, "password:", password);

    if (!email || !password) {
      error = { message: "Email or password is required." };
      return callback(error, null);
    }

    findUserByEmail(email, (err, user) => {
      if (err === null && user) {
        const passwordCheck = bcrypt.compareSync(password, user.password);

        if (passwordCheck) {
          const auth = new Auth(app);
          auth.createToken(user, null, (err, token) => {
            if (err) {
              error = {
                message: "An error occurred while logging in to your account.",
              };
              return cb(error, null);
            }
            delete user.password;
            token.user = user;
            return callback(null, token);
          });
        } else {
          error = { message: "Password does not match." };
          return callback(error, null);
        }
      }
      if (err || !user) {
        error = {
          message: "An error occurred while logging in to your account.",
        };
        return callback(error, null);
      }
    });
  };

  const initWithObject = function (obj) {
    this.model.name = _.trim(_.get(obj, "name", null));
    this.model.email = _.toLower(_.trim(_.get(obj, "email", null)));
    this.model.password = _.get(obj, "password", null);
    return this;
  };

  const validate = function (cb = () => {}) {
    let errors = [];
    const model = this.model;
    const db = this.app.db;

    if (model.password.length < 3) {
      errors.push({
        message: "Password should be more than 3 characters.",
      });
    }

    findUserByEmail(model.email, (err, user) => {
      if (err || user) {
        errors.push({ message: "Email already exists." });
      }
      return cb(errors);
    });
  };

  const findUserByEmail = function (email = null, callback = () => {}) {
    const db = this.app.db;
    const query = {
      email: email,
    };
    db.collection("users")
      .find(query)
      .limit(1)
      .toArray((err, result) => {
        return callback(err, _.get(result, "[0]", null));
      });
  };

  const create = function (cb) {
    let model = this.model;
    const db = this.app.db;
    const hashPassword = bcrypt.hashSync(model.password, saltRounds);
    model.password = hashPassword;

    validate((errors) => {
      let messages = [];
      if (errors.length > 0) {
        _.each(errors, (err) => {
          messages.push(err.message);
        });
        return cb(_.join(messages, ","), null);
      }

      db.collection("users").insertOne(model, (err, result) => {
        return cb(err, model);
      });
    });
  };

  const model = {
    name: null,
    email: null,
    password: null,
    created: new Date(),
    updated: null,
  };

  const findUserByEmailBound = findUserByEmail.bind(this);
  const loginBound = login.bind(this);
  const findByIdBound = findById.bind(this);

  return {
    model,
    findUserByEmail: findUserByEmailBound,
    login: loginBound,
    findById: findByIdBound,
    initWithObject,
    validate,
    create,
  };
};

module.exports = User;
