const express = require("express");
const Router = express.Router();

const Post = require("../models/Post");

Router.get("/", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/user/login");
  }
  const user = req.session.user;

  let allposts;
  Post.find()
    .populate("userid")
    .lean()
    .then((posts) => {
      allposts = posts.reverse();

      res.render("thongbao", { user, allposts });
    });
});

module.exports = Router;
