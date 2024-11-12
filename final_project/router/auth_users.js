const express = require('express');
let books = require("./booksdb.js");
const regd_users = express.Router();
const jwt = require('jsonwebtoken');

let users = [];
let reviews = [];

const isValid = (username) => {
  // Check if the username is valid (e.g., non-empty and not already in use)
  return users.some(user => user.username === username);
};

const authenticatedUser = (username, password) => {
  // Check if username and password match any existing user
  return users.some(user => user.username === username && user.password === password);
};

// Register a new user
regd_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  // Check if username and password are provided
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  // Check if the username already exists
  if (isValid(username)) {
    return res.status(409).json({ message: "Username already exists." });
  }

  // Add the new user
  users.push({ username, password });
  return res.status(201).json({ message: "User registered successfully." });
});

// Only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  if (authenticatedUser(username, password)) {
    // Create a JWT token
    const token = jwt.sign({ username }, 'your_secret_key', { expiresIn: '1h' });

    // Send the token in the response
    return res.status(200).json({
      message: "Login successful",
      token: token
    });
  } else {
    return res.status(401).json({ message: "Invalid username or password." });
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization") && req.header("Authorization").split(" ")[1];
  if (!token) {
    return res.status(403).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, 'your_secret_key');
    req.username = decoded.username; // Store username in request object
    next();
  } catch (ex) {
    res.status(400).json({ message: "Invalid token." });
  }
};

// Add or Update a Book Review
regd_users.put("/auth/review/:isbn", verifyToken, (req, res) => {
  const { isbn } = req.params;
  const review = req.query.review;  // Review is passed as a query parameter

  if (!review) {
    return res.status(400).json({ message: "Review text is required." });
  }

  const username = req.username;  // Get username from decoded token

  // Check if the user already has a review for this ISBN
  const existingReview = reviews.find(r => r.isbn === isbn && r.username === username);

  if (existingReview) {
    // Modify the existing review
    existingReview.review = review;
    return res.status(200).json({ message: "Review updated successfully." });
  } else {
    // Add new review
    reviews.push({ isbn, username, review });
    return res.status(201).json({ message: "Review added successfully." });
  }
});

// Delete a Book Review
regd_users.delete("/auth/review/:isbn", verifyToken, (req, res) => {
  const { isbn } = req.params;
  const username = req.username;  // Get username from decoded token

  // Find the review to delete
  const reviewIndex = reviews.findIndex(r => r.isbn === isbn && r.username === username);

  if (reviewIndex === -1) {
    return res.status(404).json({ message: "Review not found." });
  }

  // Delete the review
  reviews.splice(reviewIndex, 1);
  return res.status(200).json({ message: "Review deleted successfully." });
});

// Use the routes defined in regd_users
module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
module.exports.reviews = reviews;