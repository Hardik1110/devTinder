const express = require("express");

const app = express();

app.use("/test", (req, res) => {
  res.send("Hello from server2");
});

app.use("/hello", (req, res) => {
  res.send("Hello from server3");
});

app.use("/", (req, res) => {
  res.send("Hello from server1");
});

app.listen(7777, () => {
  console.log("Server is running on port 7777");
});
