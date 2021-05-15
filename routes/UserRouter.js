const express = require("express");
const bcrypt = require("bcryptjs");
const formidable = require("formidable");
const fs = require("fs");
const { validationResult } = require("express-validator");

const registerValidator = require("./validators/registerValidator");
const loginValidator = require("./validators/loginValidator");
const changePassValidator = require("./validators/changePassValidator");
const User = require("../models/User");
const Post = require("../models/Post");

const Router = express.Router();

Router.use(express.static("public"));

Router.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }

  const error = req.flash("error") || "";
  const username = req.flash("username") || "";

  res.render("login", { error, username });
});

Router.post("/login", loginValidator, (req, res) => {
  let result = validationResult(req);

  if (result.errors.length === 0) {
    let { username, password } = req.body;
    let account = undefined;

    User.findOne({ username: username })
      .then((u) => {
        if (!u) {
          throw new Error("Username này không tồn tại");
        }
        account = u;
        return bcrypt.compare(password, u.password);
      })
      .then((passwordMatch) => {
        if (!passwordMatch) {
          throw new Error("Sai mật khẩu");
        } else {
          req.session.user = account;

          return res.redirect("/");
        }
      })
      .catch((e) => {
        req.flash("error", e.message);
        req.flash("username", username);

        return res.redirect("/user/login");
      });
  } else {
    let messages = result.mapped();
    let message = "";

    for (m in messages) {
      message = messages[m].msg;
      break;
    }
    let username = req.body.username;

    req.flash("error", message);
    req.flash("username", username);

    res.redirect("/user/login");
  }
});

Router.get("/register", (req, res) => {
  if (!req.session.user || req.session.user.role[0] !== "admin") {
    return res.redirect("/");
  }

  const user = req.session.user;

  const error = req.flash("error") || "";
  const username = req.flash("username") || "";

  res.render("register", { error, username, user });
});

Router.post("/register", registerValidator, (req, res) => {
  let result = validationResult(req);

  if (result.errors.length === 0) {
    let { username, password, role } = req.body;

    User.findOne({ username: username })
      .then((u) => {
        if (u) {
          throw new Error("Username này đã tồn tại");
        }
      })
      .then(() => bcrypt.hash(password, 10))
      .then((hashed) => {
        let user = new User({
          username: username,
          password: hashed,
          role: role,
        });

        return user.save();
      })
      .then(() => {
        req.flash("error", "Đăng ký thành công");
        return res.redirect("/user/register");
      })
      .catch((e) => {
        req.flash("error", e.message);
        req.flash("username", username);

        return res.redirect("/user/register");
      });
  } else {
    let messages = result.mapped();
    let message = "";

    for (m in messages) {
      message = messages[m].msg;
      break;
    }
    let username = req.body.username;

    req.flash("error", message);
    req.flash("username", username);

    res.redirect("/user/register");
  }
});

Router.get("/changeinfo", (req, res) => {
  if (!req.session.user || req.session.user.role[0] !== "student") {
    return res.redirect("/");
  }

  const user = req.session.user;
  const error = req.flash("error") || "";

  res.render("changeInfo", { user, error });
});

Router.put("/changeinfo/:id", (req, res) => {
  let { id } = req.params;
  if (!id) {
    return res.json({
      code: 1,
      message: "User không tồn tại",
    });
  }

  let supportedFields = ["username", "class", "khoa", "image"]; // Chỉ tiếp nhận các thuộc tính nằm trong dach sách định nghĩa trc
  let updateData = req.body;

  if (!updateData) {
    req.flash("error", "Không có gì để cập nhật");
    return res.redirect("/user/changeinfo");
  }

  for (field in updateData) {
    if (!supportedFields.includes(field)) {
      delete updateData[field]; // Xóa các field không được hỗ trợ, chỉ giữ lại name price desc
    }
  }

  User.findByIdAndUpdate(id, updateData, {
    new: true, // có nghĩa là update xong sẽ trả về data mới
  })
    .then((user) => {
      if (user) {
        req.flash("error", "Thay đổi thành công");
        req.session.user = user;
        return res.redirect("/user/changeinfo");
      } else {
        req.flash("error", "Không tìm thấy người dùng");
        return res.redirect("/user/changeinfo");
      }
    })
    .catch((e) => {
      if (e.message.includes("Cast to ObjectId failed")) {
        return res.json({
          code: 3,
          message: "ID không hợp lệ",
        });
      }
      return res.json({
        code: 3,
        message: e.message,
      });
    });
});

Router.get("/changepass", (req, res) => {
  if (
    !req.session.user ||
    req.session.user.role[0] === "student" ||
    req.session.user.role[0] === "admin"
  ) {
    return res.redirect("/");
  }

  const user = req.session.user;
  const error = req.flash("error") || "";

  res.render("changePass", { user, error });
});

Router.put("/changepass/:id", changePassValidator, (req, res) => {
  let { id } = req.params;
  if (!id) {
    return res.json({
      code: 1,
      message: "User không tồn tại",
    });
  }

  let result = validationResult(req);
  if (result.errors.length === 0) {
    let { oldPass, newPass } = req.body;

    User.findById(id)
      .then((user) => {
        return bcrypt.compare(oldPass, user.password);
      })
      .then((passwordMatch) => {
        if (!passwordMatch) {
          throw new Error("Sai mật khẩu");
        } else {
          return bcrypt.hash(newPass, 10);
        }
      })
      .then((hashed) => {
        User.findByIdAndUpdate(id, { password: hashed }, { new: true }).then(
          (u) => {
            if (u) {
              req.flash("error", "Đổi mật khẩu thành công");
              return res.redirect("/user/changepass");
            } else {
              req.flash("error", "Không tìm thấy người dùng");
              return res.redirect("/user/changepass");
            }
          }
        );
      })
      .catch((e) => {
        req.flash("error", e.message);
        return res.redirect("/user/changepass");
      });
  } else {
    let messages = result.mapped();
    let message = "";

    for (m in messages) {
      message = messages[m].msg;
      break;
    }

    req.flash("error", message);

    res.redirect("/user/changepass");
  }
});

Router.post("/doPost", (req, res) => {
  let { title, content, pk, image, video } = req.body;
  let userid = req.session.user._id;
  let videoid = video.slice(17);
  let videourl = "https://www.youtube.com/embed/" + videoid;
  let post;

  if (video.length > 0) {
    post = new Post({
      title: title,
      content: content,
      userid: userid,
      pk: pk,
      image: image,
      video: videourl,
    });
  } else {
    post = new Post({
      title: title,
      content: content,
      userid: userid,
      pk: pk,
      image: image,
    });
  }

  post.save();
  res.send("Đăng bài thành công");
});

Router.post("/douploadimage", (req, res) => {
  let formData = new formidable.IncomingForm();
  formData.parse(req, function (err, fields, files) {
    let oldPath = files.file.path; // path user selected(trên máy user)
    let newPath = "public/images/" + files.file.name; // path sẽ lưu file
    let Path = "images/" + files.file.name;

    fs.rename(oldPath, newPath, function (err) {
      res.send("/" + Path);
    });
  });
});

Router.post("/doupdateimage", (req, res) => {
  let formData = new formidable.IncomingForm();
  formData.parse(req, function (err, fields, files) {
    fs.unlink(fields.image.replace("/", ""), function (err) {
      let oldPath = files.file.path; // path user selected(trên máy user)
      let newPath = "public/images/" + files.file.name; // path sẽ lưu file
      let Path = "images/" + files.file.name;

      fs.rename(oldPath, newPath, function (err) {
        res.send("/" + Path);
      });
    });
  });
});

Router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/user/login");
});

module.exports = Router;
