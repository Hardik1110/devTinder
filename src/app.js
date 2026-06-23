const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const user = require("./models/user");
const connectDB = require("./config/database");
const { validateSignUpData } = require("./utils/validation");
const cookieParser = require("cookie-parser");

const app = express();
app.use(cookieParser());
app.use(express.json());

// Fetch users by email — pass it as a query param: /users?emailId=foo@bar.com
app.get("/users", async (req, res) => {
  const userEmailId = req.body.emailId;
  try {
    console.log(userEmailId);
    const users = await user.find({ emailId: userEmailId });
    res.send(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Profile — read the token cookie, verify it, and return the logged-in user
app.get("/profile", async (req, res) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      throw new Error("Invalid token");
    }

    // Verify the token's signature and decode the payload
    const decoded = jwt.verify(token, "DEV@Tinder$790");
    const { _id } = decoded;

    const loggedInUser = await user.findById(_id);
    if (!loggedInUser) {
      throw new Error("User does not exist");
    }

    res.send(loggedInUser);
  } catch (error) {
    res.status(400).send("ERROR: " + error.message);
  }
});

// Fetch all users
app.get("/feeds", async (req, res) => {
  try {
    const users = await user.find();
    res.send(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password,
    );

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Create a signed JWT containing the user's id, and send it as a cookie
    const token = jwt.sign({ _id: existingUser._id }, "DEV@Tinder$790");
    res.cookie("token", token);

    res.send("Login successful");
  } catch (error) {
    res.status(400).send("ERROR: " + error.message);
  }
});

// Update part of a user (PATCH) — only the fields sent in the body change
app.patch("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  const data = req.body;

  try {
    // Only these fields are allowed to be updated via the API.
    const ALLOWED_UPDATES = [
      "firstName",
      "lastName",
      "age",
      "gender",
      "photoUrl",
      "about",
      "skills",
    ];
    const isUpdateAllowed = Object.keys(data).every((field) =>
      ALLOWED_UPDATES.includes(field),
    );
    if (!isUpdateAllowed) {
      throw new Error("Update not allowed: only certain fields can be changed");
    }
    if (data.skills && data.skills.length > 10) {
      throw new Error("Skills cannot be more than 10");
    }

    const updatedUser = await user.findByIdAndUpdate(userId, data, {
      new: true,
      runValidators: true, // enforce schema validation on update too
    });
    res.send(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Replace a user (PUT) — overwrites the whole document with the body
app.put("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const updatedUser = await user.findByIdAndUpdate(userId, req.body, {
      new: true,
      overwrite: true,
    });
    res.send(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
