const express = require("express");
const user = require("./models/user");
const connectDB = require("./config/database");

const app = express();

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

// Fetch all users
app.get("/feeds", async (req, res) => {
  try {
    const users = await user.find();
    res.send(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new user from the request body
app.post("/users", async (req, res) => {
  const newUser = new user(req.body);
  try {
    await newUser.save();
    console.log("User created successfully:", newUser);
    res.status(201).json(newUser);
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
