const express = require("express");
const Router = express.Router();
const formidable = require("formidable");
const fs = require("fs");
const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

Router.get("/:id", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/user/login");
  }
  const user = req.session.user;
  let id = req.params.id;
  if (!id) {
    return res.json({
      code: 1,
      message: "Bài viết không tồn tại",
    });
  }
  Post.findById(id)
    .populate("userid")
    .lean()
    .then((post) => {
      if (post) {
        Comment.find({ postid: id })
          .populate("userid")
          .lean()
          .then((comments) => {
            return res.render("post", { user, post, comments });
          });
      } else {
        return res.json({
          code: 2,
          message: "Không tìm thấy bài viết",
        });
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

Router.get("/changePost/:id", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/user/login");
  }

  let id = req.params.id;
  const user = req.session.user;
  const error = req.flash("error") || "";

  Post.findById(id)
    .populate("userid")
    .lean()
    .then((post) => {
      if (post.userid._id != user._id) {
        return res.redirect("/");
      }
      return res.render("changePost", { post, user, error });
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

Router.put("/changePost/:id", (req, res) => {
  let { id } = req.params;
  if (!id) {
    return res.json({
      code: 1,
      message: "Bài viết không tồn tại",
    });
  }
  let { title, content, image, video } = req.body;
  let videoid = video.slice(17);
  let videourl = "https://www.youtube.com/embed/" + videoid;

  let supportedFields = ["title", "content", "image"];
  let updateData = { title, content, image };

  if (video.length > 0) {
    supportedFields = ["title", "content", "image", "video"];
    updateData = { title, content, image, video: videourl };
  }

  if (!updateData) {
    req.flash("error", "Không có gì để cập nhật");
    return res.redirect("/post/changePost/" + id);
  }

  for (field in updateData) {
    if (!supportedFields.includes(field)) {
      delete updateData[field]; // Xóa các field không được hỗ trợ, chỉ giữ lại name price desc
    }
  }

  Post.findByIdAndUpdate(id, updateData, {
    new: true, // có nghĩa là update xong sẽ trả về data mới
  })
    .then((post) => {
      if (post) {
        req.flash("error", "Thay đổi thành công");

        return res.redirect("/post/changePost/" + id);
      } else {
        req.flash("error", "Không tìm thấy bài viết");
        return res.redirect("/post/changePost/" + id);
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

Router.delete("/:id", (req, res) => {
  let image = req.body.image;
  let { id } = req.params;
  if (!id) {
    return res.json({
      code: 1,
      message: "Bài viết không tồn tại",
    });
  }

  fs.unlink(image.replace("/", ""), function (err) {
    Post.findByIdAndDelete(id)
      .then((post) => {
        if (post) {
          return res.redirect("/");
        } else {
          return res.json({
            code: 2,
            message: "Không tìm thấy bài viết",
          });
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
});

Router.post("/doComment", (req, res) => {
  let { content, postid } = req.body;
  let userid = req.session.user._id;

  let comment = new Comment({
    content: content,
    userid: userid,
    postid: postid,
  });

  comment.save();
  res.send("Comment thành công");
});

Router.delete("/comment/:id", (req, res) => {
  let { id } = req.params;
  if (!id) {
    return res.json({
      code: 1,
      message: "Comment không tồn tại",
    });
  }

  Comment.findByIdAndDelete(id)
    .then((cmt) => {
      if (cmt) {
        res.send("Xóa thành công");
      } else {
        return res.json({
          code: 2,
          message: "Không tìm thấy comment",
        });
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

module.exports = Router;
