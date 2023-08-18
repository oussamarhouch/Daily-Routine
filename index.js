//jshint esversion:6

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
    cookie: { _expires: 10000000 },
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  LastName: String,
  FirstName: String,
  adress: String,
  city: String,
  country: String,
  secret: String,
});

const listSchema = new mongoose.Schema({
  name: String,
  username: String,
});

const operationSchema = new mongoose.Schema({
  operation: String,
  amount: Number,
  type: String,
  username: String,
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

const List = new mongoose.model("List", listSchema);

const Operations = new mongoose.model("Operations", operationSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("home", { statut: 1 });
  } else {
    res.render("home", { statut: 0 });
  }
});

app.get("/about", function (req, res) {
  res.render("about", { statut: 0 });
});

app.get("/login", function (req, res) {
  res.render("login", { statut: 0 });
});

app.get("/register", function (req, res) {
  res.render("register", { statut: 0 });
});

app.get("/todo", function (req, res) {
  if (req.isAuthenticated()) {
    List.find({ username: req.user.username }, function (err, foundItems) {
      if (err) {
        console.log(err);
      } else {
        res.render("todo", { newListItems: foundItems, statut: 1 });
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/operations", function (req, res) {
  if (req.isAuthenticated()) {
    Operations.find(
      { username: req.user.username },
      function (err, foundOperations) {
        if (err) {
          console.log(err);
        } else {
          res.render("operations", {
            newListOperations: foundOperations,
            total: 0,
            statut: 1,
          });
        }
      }
    );
  } else {
    res.redirect("/login");
  }
});

app.get("/account", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("account", { user: req.user, statut: 1 });
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    }
  });
  res.redirect("/");
});

app.post("/register", function (req, res) {
  User.register(
    {
      username: req.body.username,
      email: req.body.email,
      LastName: req.body.LastName,
      FirstName: req.body.FirstName,
    },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  console.log(user);
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/");
      });
    }
  });
});

app.post("/todo", function (req, res) {
  const submittedItem = {
    name: req.body.newItem,
    username: req.user.username,
  };

  const item = new List(submittedItem);
  item.save(function (err, item) {
    if (err) {
      console.error(err);
    } else {
      res.redirect("/todo");
    }
  });
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  List.findByIdAndRemove(checkedItemId, function (err) {
    if (!err) {
      console.log("Successfully deleted checked item.");
      res.redirect("/todo");
    }
  });
});

app.post("/operations", function (req, res) {
  const submittedOperation = {
    operation: req.body.newOperation,
    amount: req.body.amount,
    type: req.body.type,
    username: req.user.username,
  };

  const operation = new Operations(submittedOperation);
  operation.save(function (err, operation) {
    if (err) {
      console.error(err);
    } else {
      res.redirect("/operations");
    }
  });
});

app.post("/deleteOperation", function (req, res) {
  const checkedOperationId = req.body.checkbox;
  console.log(checkedOperationId);
  Operations.findByIdAndRemove(checkedOperationId, function (err) {
    if (!err) {
      console.log("Successfully deleted checked operations.");
      res.redirect("/operations");
    }
  });
});

app.listen(process.env.PORT || 3000, function (req, res) {
  console.log("Server started on port 3000");
});
