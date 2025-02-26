const express = require("express");
const connectToDb = require("./config/connectToDb");
const xss = require("xss-clean");
const rateLimiting = require("express-rate-limit");
const helmet = require("helmet");
const hpp = require("hpp");
const { errorHandler, notFound } = require("./middlewares/error");
const cors = require("cors"); 
require("dotenv").config();

// Connextion to MongoDb 
connectToDb();

// init app
const app = express();

// Middlewares 
app.use(express.json());

// Security Headers (helmet)
app.use(helmet());

// Prevent Http Param Pollution 
app.use(hpp());

// Prevent XSS(Cross Site Scripting) Attacks
app.use(xss());

// Rate Limiting
app.use(rateLimiting({
    window: 10 * 60 * 1000, //10 minutes
    max: 200,
}))

// cors policy
app.use(cors({
    origin: "https://elhlwany-blog.netlify.app"
    // origin: "http://localhost:3000"
}))

// Routes
app.use("/api/auth" , require("./routes/authRoute"));
app.use("/api/users" , require("./routes/usersRoute"));
app.use("/api/posts" , require("./routes/postsRoute"));
app.use("/api/comments" , require("./routes/comments.Route"));
app.use("/api/categories" , require("./routes/categorysRoute"));
app.use("/api/password" , require("./routes/passwordRoute"));

// Error Handler Middleware
app.use(notFound);
app.use(errorHandler);


module.exports = app;


// // Running The Servier
// const PORT = process.env.PORT || 8000;
// app.listen(PORT , ()=> console.log(`Server Is Running in ${process.env.NODE_ENV } mode on Port ${PORT} *_^`));
