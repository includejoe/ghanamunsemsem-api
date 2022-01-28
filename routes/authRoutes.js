const router = require("express").Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");

const Author = require("../models/author");
const { SECRET_KEY } = require("../config");

function generateToken(author) {
  return JWT.sign(
    {
      id: author.id,
      firstname: author.firstname,
      lastname: author.lastname,
    },
    SECRET_KEY,
    { expiresIn: "1h" }
  );
}

// sign up
router.post(
  "/signup",
  [
    check(
      "firstname",
      "First Name must not be more that 20 characters"
    ).isLength({ max: 20 }),
    check("lastname", "Last Name must not be more that 20 characters").isLength(
      { max: 20 }
    ),
    check("email", "Please provide a valid email").isEmail(),
    check("password", "Your password must be more than 6 characters").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const { firstname, lastname, email, password, confirmPassword } = req.body;

    // validate input
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({
        errors: errors.array(),
      });
    }

    if (password !== confirmPassword) {
      return res.status(422).json({
        errors: [
          {
            msg: "Passwords must match",
          },
        ],
      });
    }

    // validate if admin doesn't already exist
    let author = await Author.findOne({ email });
    if (author) {
      return res.status(422).json({
        errors: [
          {
            msg: "This author already exists",
          },
        ],
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 12);

    const newAuthor = new Author({
      firstname,
      lastname,
      email,
      hashedPassword,
    });

    const createdAuthor = await newAuthor.save();

    const token = generateToken(createdAuthor);

    res.json({ token });
  }
);

// login
router.post(
  "/login",
  [
    check("email", "Please provide a valid email").isEmail(),
    check("password", "Your password must be more than 6 characters").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const { email, password } = req.body;

    // validate input
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({
        errors: errors.array(),
      });
    }

    let author = await Author.findOne({ email });

    if (!author) {
      return res.status(422).json({
        errors: [
          {
            msg: "Invalid credentials",
          },
        ],
      });
    }

    let match = bcrypt.compareSync(password, author.hashedPassword);

    if (!match) {
      return res.status(422).json({
        errors: [
          {
            msg: "Invalid credentials",
          },
        ],
      });
    }

    const token = generateToken(author);

    res.json({ token });
  }
);

module.exports = router;
