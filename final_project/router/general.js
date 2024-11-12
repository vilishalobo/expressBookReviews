const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Register User
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  // Check if the username already exists
  new Promise((resolve, reject) => {
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
      reject({ message: "Username already exists" });
    } else {
      resolve();
    }
  })
  .then(() => {
    const newUser = { username, password };  // Ideally, you would hash the password
    users.push(newUser);
    res.status(201).json({ message: "User registered successfully" });
  })
  .catch(error => {
    res.status(400).json(error);
  });
});

// Get the book list available in the shop
public_users.get('/', function (req, res) {
  new Promise((resolve, reject) => {
    if (books && Object.keys(books).length > 0) {
      resolve(books);
    } else {
      reject({ message: "No books available" });
    }
  })
  .then(data => res.send(JSON.stringify(data, null, 4)))
  .catch(error => res.status(404).send(error));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', (req, res) => {
  const isbn = req.params.isbn;

  new Promise((resolve, reject) => {
      let book = books[isbn];

      if (book) {
          resolve(book);
      } else {
          reject({ message: "Book not found with the provided ISBN." });
      }
  })
  .then(data => res.send(data))
  .catch(error => res.status(404).send(error));
});

// Get book details based on author
public_users.get('/author/:author', function (req, res) {
  const author = req.params.author;

  new Promise((resolve, reject) => {
    const booksByAuthor = Object.values(books).filter(book => book.author.toLowerCase() === author.toLowerCase());
    
    if (booksByAuthor.length > 0) {
      resolve(booksByAuthor);
    } else {
      reject({ message: "No books found by this author" });
    }
  })
  .then(data => res.send(JSON.stringify(data, null, 4)))
  .catch(error => res.status(404).json(error));
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
  const title = req.params.title;

  new Promise((resolve, reject) => {
    const booksByTitle = Object.values(books).filter(book => book.title.toLowerCase().includes(title.toLowerCase()));

    if (booksByTitle.length > 0) {
      resolve(booksByTitle);
    } else {
      reject({ message: "No books found with this title" });
    }
  })
  .then(data => res.send(JSON.stringify(data, null, 4)))
  .catch(error => res.status(404).json(error));
});

// Get book review
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;

  new Promise((resolve, reject) => {
    const book = Object.values(books).find(book => book.isbn === isbn);

    if (book && book.reviews) {
      resolve(book.reviews);
    } else {
      reject({ message: "No reviews found for this book" });
    }
  })
  .then(data => res.send(JSON.stringify(data, null, 4)))
  .catch(error => res.status(404).json(error));
});

module.exports.general = public_users;