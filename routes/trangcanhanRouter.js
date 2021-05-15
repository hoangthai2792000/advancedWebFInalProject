const express = require("express");
const Router = express.Router();

const Post = require("../models/Post");
const User = require("../models/User");

Router.get("/:id", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/user/login");
  }

  const user = req.session.user;
  let id = req.params.id;
  if (!id) {
    return res.json({
      code: 1,
      message: "User không tồn tại",
    });
  }

  let allposts;
  let u;
  Post.find({ userid: id })
    .populate("userid")
    .lean()
    .then((post) => {
      if (post.length > 0) {
        allposts = post.reverse();
        return res.render("trangcanhan", { allposts, user });
      } else {
        User.findById(id).then((user) => {
          u = user;
          return res.render("trangtrong", { u, user });
        });
      }
    });
});

module.exports = Router;
