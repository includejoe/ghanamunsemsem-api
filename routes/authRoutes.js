const router = require("express").Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const fs = require("fs");
const JWT = require("jsonwebtoken");

const upload = require("../middleware/uploadAuthorProfileImage");
const Author = require("../models/author");
const SecretCode = require("../models/secretCode");
const { SECRET_KEY } = require("../config");
const checkAuth = require("../middleware/checkAuth");

function generateToken(author) {
  return JWT.sign(
    {
      id: author.id,
      email: author.email,
      firstname: author.firstname,
      lastname: author.lastname,
    },
    SECRET_KEY,
    { expiresIn: "24h" }
  );
}

// get author details
router.get("/author", checkAuth, async (req, res) => {
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
    check("secretCode", "Secret Code must not be empty").notEmpty(),
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
        secretCode,
      } = req.body;

      // validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).send({
          errors: errors.array(),
        });
      }

      // check secret code
      const code = await SecretCode.findOne({ code: secretCode });
      if (!code) {
        return res.status(422).send({
          errors: [
            {
              msg: "Invalid Secret Code",
            },
          ],
        });
      }

      if (code.used === true) {
        return res.status(422).send({
          errors: [
            {
              msg: "This Secret Code has Already Been Used",
            },
          ],
        });
      }

      // check if passwords match
      if (password !== confirmPassword) {
        return res.status(422).send({
          errors: [
            {
              msg: "Passwords Must Match",
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
              msg: "This Author Already Exists",
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
        secretCode: code.id,
      });

      const createdAuthor = await newAuthor.save();

      // update secret code used status
      await SecretCode.findByIdAndUpdate(code.id, {
        used: true,
      });

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
              msg: "Invalid Credentials",
            },
          ],
        });
      }

      let match = bcrypt.compareSync(password, author.hashedPassword);

      if (!match) {
        return res.status(422).send({
          errors: [
            {
              msg: "Invalid Credentials",
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
    upload.single("profilePic"),
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
        if (author?.profilePic) {
          const imageLink = "." + author.profilePic;
          fs.unlink(imageLink, (err) => {
            if (err) {
              return res.status(500).send({
                errors: [
                  {
                    msg: "Old Profile Picture Updating Error",
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
                    msg: "New Passwords Must Match",
                  },
                ],
              });
            }
          } else {
            return res.status(422).send({
              errors: [
                {
                  msg: "Old Password is Incorrect",
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
                    msg: "New Passwords Must Match",
                  },
                ],
              });
            }
          } else {
            return res.status(422).send({
              errors: [
                {
                  msg: "Old Password is Incorrect",
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
