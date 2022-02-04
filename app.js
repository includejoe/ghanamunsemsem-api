const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");

// express app
const app = express();

// allow json
app.use(express.json());

// enable cors
app.use(cors());

// connect to mongodb
const dbURI =
  "mongodb+srv://joe:test1234@ghanamunsemsem.quqg6.mongodb.net/ghanamunsemsem_db?retryWrites=true&w=majority";
mongoose
  .connect(dbURI, { useNewUrlParser: true })
  .then(() => {
    console.log("MongoDB Connected");
    return app.listen({ port: 8000 });
  })
  .then(() => {
    console.log(`Server running at http://localhost:8000`);
  })
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Hi, this is local host port 8000");
});

// static files
app.use("/uploads", express.static("uploads"));

// auth routes
app.use("/auth", authRoutes);

// blog routes
app.use("/blogs", blogRoutes);
