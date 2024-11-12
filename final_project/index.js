const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

// Session configuration
app.use("/customer", session({
    secret: "fingerprint_customer",
    resave: true,
    saveUninitialized: true
}));

const { users, authenticatedUser } = require('./router/auth_users.js'); // Ensure correct path

// Authentication middleware for /customer/auth/*
app.use("/customer/auth/*", function auth(req, res, next) {
    // Retrieve the token from the session
    const token = req.session.token;
    
    // Check if the token exists
    if (!token) {
        return res.status(403).json({ message: "Access denied. No token provided." });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, "your_jwt_secret_key"); // Replace with your JWT secret
        req.user = decoded; // Store decoded info in req.user for further use
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        // If token is invalid
        return res.status(403).json({ message: "Invalid token." });
    }
}); 

// Login route to generate and store JWT in session
app.post("/customer/login", (req, res) => {
    const { username, password } = req.body;

    // Check if the user exists and the password is correct
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Generate a JWT token
        const token = jwt.sign({ username: user.username }, "your_jwt_secret_key", { expiresIn: '1h' });

        // Save the token in the session
        req.session.token = token;

        return res.status(200).json({
            message: "Login successful",
            token: token
        });
    } else {
        return res.status(401).json({ message: "Invalid username or password." });
    }
});

// Routes
app.use("/customer", customer_routes);
app.use("/", genl_routes);

const PORT = 5000;
app.listen(PORT, () => console.log("Server is running"));
