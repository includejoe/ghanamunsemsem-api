const router = require("express").Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");

const upload = require("../middleware/uploadAuthorProfileImage");
const Author = require("../models/author");
const { SECRET_KEY } = require("../config");
const checkAuth = require("../middleware/checkAuth");

function generateToken(author) {
  return JWT.sign(
    {
      id: author.id,
      email: author.email,
      dob: author.dob,
      firstname: author.firstname,
      lastname: author.lastname,
      gender: author.gender,
    },
    SECRET_KEY,
    { expiresIn: "24h" }
  );
}

// get author details
router.get("author", checkAuth, async (req, res) => {
  try {
    id = req.author.id;
    const author = await Author.findById(id);
    res.status(200).json({
      author,
    });
  } catch (err) {
    res.status(500).send({
      errors: [
        {
          msg: "Internal Server Error",
        },
      ],
    });
    throw new Error(err);
  }
});

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
    check("gender", "Gender must not be empty").notEmpty(),
    check("dob", "Date of birth must not be empty").notEmpty(),
    check("email", "Please provide a valid email").isEmail(),
    check("password", "Your password must be more than 6 characters").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    try {
      const {
        firstname,
        lastname,
        gender,
        dob,
        email,
        password,
        confirmPassword,
      } = req.body;

      // validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).send({
          errors: errors.array(),
        });
      }

      if (password !== confirmPassword) {
        return res.status(422).send({
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
        return res.status(422).send({
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
        gender,
        dob,
        email,
        hashedPassword,
      });

      const createdAuthor = await newAuthor.save();

      const token = generateToken(createdAuthor);

      res.json({ token });
    } catch (err) {
      res.status(500).send({
        errors: [
          {
            msg: "Internal Server Error",
          },
        ],
      });
      throw new Error(err);
    }
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
    try {
      const { email, password } = req.body;

      // validate input
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(422).send({
          errors: errors.array(),
        });
      }

      let author = await Author.findOne({ email });

      if (!author) {
        return res.status(422).send({
          errors: [
            {
              msg: "Invalid credentials",
            },
          ],
        });
      }

      let match = bcrypt.compareSync(password, author.hashedPassword);

      if (!match) {
        return res.status(422).send({
          errors: [
            {
              msg: "Invalid credentials",
            },
          ],
        });
      }

      const token = generateToken(author);

      res.json({ token });
    } catch (err) {
      res.status(500).send({
        errors: [
          {
            msg: "Internal Server Error",
          },
        ],
      });
      throw new Error(err);
    }
  }
);

// update profile
router.put(
  "/update_profile",
  [
    checkAuth,
    upload.single("profile_pic"),
    [
      check(
        "firstname",
        "First Name must not be more that 20 characters"
      ).isLength({ max: 20 }),
      check(
        "lastname",
        "Last Name must not be more that 20 characters"
      ).isLength({ max: 20 }),
      check("gender", "Gender must not be empty").notEmpty(),
      check("dob", "Date of birth must not be empty").notEmpty(),
      check("email", "Please provide a valid email").isEmail(),
      check(
        "newPassword",
        "Your new password must be more than 6 characters"
      ).isLength({
        min: 6,
      }),
    ],
  ],
  async (req, res) => {
    try {
      const authorId = req.author.id;
      const author = await Author.findById(authorId);
      if (!author) {
        return res.status(400).json({
          errors: [
            {
              msg: "Author Not Found",
            },
          ],
        });
      }

      const {
        firstname,
        lastname,
        gender,
        dob,
        oldPassword,
        newPassword,
        confirmNewPassword,
      } = req.body;

      // validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).send({
          errors: errors.array(),
        });
      }

      // if new profile pic submitted
      if (req.file) {
        if (author.profilePic) {
          const imageLink = "." + author.profilePic;
          fs.unlink(imageLink, (err) => {
            if (err) {
              return res.status(500).send({
                errors: [
                  {
                    msg: "Old profile picture deletion error",
                  },
                ],
              });
            }
          });
        }

        // if password changed
        if (oldPassword && newPassword && confirmNewPassword) {
          let match = bcrypt.compareSync(oldPassword, author.hashedPassword);

          if (match) {
            if (newPassword !== confirmNewPassword) {
              return res.status(422).send({
                errors: [
                  {
                    msg: "New Passwords must match",
                  },
                ],
              });
            }
          } else {
            return res.status(422).send({
              errors: [
                {
                  msg: "Old password is incorrect",
                },
              ],
            });
          }

          const hashedPassword = bcrypt.hashSync(newPassword, 12);
          const profilePic =
            "/" + req.file.destination + "/" + req.file.filename;
          const updatedAuthor = await Author.findByIdAndUpdate(authorId, {
            firstname,
            lastname,
            gender,
            dob,
            hashedPassword,
            profilePic,
          });
          res.status(200).json({ updatedAuthor });
        } /* if password not changed */ else {
          const profilePic =
            "/" + req.file.destination + "/" + req.file.filename;
          const updatedAuthor = await Author.findByIdAndUpdate(authorId, {
            firstname,
            lastname,
            gender,
            dob,
            profilePic,
          });
          res.status(200).json({ updatedAuthor });
        }
      } /* profile pic not submitted */ else {
        // if password changed
        if (oldPassword && newPassword && confirmNewPassword) {
          let match = bcrypt.compareSync(oldPassword, author.hashedPassword);

          if (match) {
            if (newPassword !== confirmNewPassword) {
              return res.status(422).send({
                errors: [
                  {
                    msg: "New Passwords must match",
                  },
                ],
              });
            }
          } else {
            return res.status(422).send({
              errors: [
                {
                  msg: "Old password is incorrect",
                },
              ],
            });
          }

          const hashedPassword = bcrypt.hashSync(newPassword, 12);
          const updatedAuthor = await Author.findByIdAndUpdate(authorId, {
            firstname,
            lastname,
            gender,
            dob,
            hashedPassword,
          });
          res.status(200).json({ updatedAuthor });
        } /* if password not changed */ else {
          const updatedAuthor = await Author.findByIdAndUpdate(authorId, {
            firstname,
            lastname,
            gender,
            dob,
          });
          res.status(200).json({ updatedAuthor });
        }
      }
    } catch (err) {
      res.status(500).send({
        errors: [
          {
            msg: "Internal Server Error",
          },
        ],
      });
      throw new Error(err);
    }
  }
);

module.exports = router;
