const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcrypt");
const cookie_parser = require("cookie-parser");
const web_token = require("jsonwebtoken");
const multer = require("multer");
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
const Post = require("./models/Post");
app.use(express.json());
app.use(cookie_parser());
require('dotenv').config({ path: './environment.env' });
const secret = "dwjehfrweuihih3ih2h2h";
const upload = multer();

const mongodb_connect = process.env.mongodb_uri;
mongoose.connect(mongodb_connect);
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, 10),
    });
    res.json(userDoc);
  } catch (e) {
    console.log(e);
    res.status(400).json(e);
  }
});
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  const password_result = bcrypt.compareSync(password, userDoc.password);
  if (password_result) {
    web_token.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
      res.cookie("token", token).json({
        id: userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json("Wrong Password");
  }
});
//

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    web_token.verify(token, secret, {}, (err, info) => {
      if (err) throw err;
      res.json(info);
    });
  } else {
    res.sendStatus(400).json("Not provided any token");
  }
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json("cleared cookie");
});

app.post("/post", upload.none(), async (req, res) => {
  const { token } = req.cookies;
  if (!token){
    res.sendStatus(403);
    return;
  }
  web_token.verify(token, secret, {}, async (err, info) =>{
    if (err) throw err;
    const { title, summary, content } = req.body;
    console.log(req.body);
    const postDoc = await Post.create({
      title,
      summary,
      content,
      author: info.id
    });
    res.json({ title, summary, content});
  });

  
});

app.get("/post", async (req, res) => {
  res.json(await Post.find().populate('author', ['username']));
});

app.get("/post/:id", async (req, res) =>{
    const {id} = req.params;
    const postInfo = await Post.findById(id).populate('author', ['username']);
    res.json(postInfo);

});
app.listen(4000);
