const express = require("express");
const bcrypt = require("bcrypt");
const user = require("./models/user");
const connectDB = require("./config/database");
const { validateSignUpData } = require("./utils/validation");
const cookieParser = require("cookie-parser");
const userAuth = require("./middlewares/auth");

const app = express();
app.use(cookieParser());
app.use(express.json());

// Create a new user — never trust req.body, validate it first.
app.post("/users", async (req, res) => {
  try {
    // 1) Validate incoming data
    validateSignUpData(req);

    // 2) Only pick the fields we allow — don't pass the raw body to the model
    const { firstName, lastName, emailId, password, age, gender } = req.body;

    // 3) Hash the password before storing it — never store plain text
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new user({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      age,
      gender,
    });

    await newUser.save();
    console.log("User created successfully:", newUser);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login — verify email + password against the stored hash
app.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const existingUser = await user.findOne({ emailId: emailId });
    if (!existingUser) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await existingUser.validatePassword(password);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Create a signed JWT (expires in 7 days) and send it as a cookie
    const token = await existingUser.getJWT();
    res.cookie("token", token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    res.send("Login successful");
  } catch (error) {
    res.status(400).send("ERROR: " + error.message);
  }
});

// Profile — read the token cookie, verify it, and return the logged-in user
app.get("/profile", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    res.send(loggedInUser);
  } catch (error) {
    res.status(400).send("ERROR: " + error.message);
  }
});

// Connect to the DB first, and only start the server once it's connected.
connectDB()
  .then(() => {
    console.log("Database connected successfully");
    app.listen(7777, () => {
      console.log("Server is running on port 7777");
    });
  })
  .catch((error) => {
    console.error("Database connection error:", error);
  });
