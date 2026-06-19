const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://daglihardik1110_db_user:Q1ODxZN4HpMK5xYy@namastenode.7oi1ytm.mongodb.net/devTinder",
  );
};

module.exports = connectDB;
