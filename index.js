require("dotenv").config();
const express = require("express");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const User = require("./models/User");
const Post = require("./models/Post");
const connectDB = require("./db");
const passport = require("passport");
require("./passport")(passport);
connectDB();
const app = express();
const port = process.env.PORT || 3000;
const socketio = require("socket.io");
const UserRouter = require("./routes/UserRouter");
const PostRouter = require("./routes/PostRouter");
const thongbaoRouter = require("./routes/thongbaoRouter");
const trangcanhanRouter = require("./routes/trangcanhanRouter");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(express.json());
app.use(
  session({
    secret: "alou",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === "object" && "_method" in req.body) {
      // look in urlencoded POST bodies and delete it
      let method = req.body._method;
      delete req.body._method;
      return method;
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use("/user", UserRouter);
app.use("/post", PostRouter);
app.use("/thongbao", thongbaoRouter);
app.use("/trangcanhan", trangcanhanRouter);
app.use("/auth", require("./routes/auth"));

app.get("/", (req, res) => {
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

      res.render("home", { user, allposts });
    });
});

const httpServer = app.listen(port, () =>
  console.log(`http://localhost:${port}`)
);
const io = socketio(httpServer);

io.on("connection", (socket) => {
  socket.on("thongbao", (pk) => {
    socket.broadcast.emit("thongbao", pk);
  });
});
