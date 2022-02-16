const router = require("express").Router();
const fs = require("fs");
const { check, validationResult } = require("express-validator");

const Blog = require("../models/blog");
const checkAuth = require("../middleware/checkAuth");
const upload = require("../middleware/uploadBlogImages");

// get all blogs
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json({ blogs });
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

// get blog details
router.get("/blog_details/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(400).json({
        errors: [
          {
            msg: "Blog Not Found",
          },
        ],
      });
    }

    res.json({ blog });
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

// blog categories
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const blogs = await Blog.find({ category }).sort({
      createdAt: -1,
    });

    if (!blogs) {
      return res.status(404).send({
        errors: [
          {
            msg: "No Blogs in this Category",
          },
        ],
      });
    }

    res.json({ blogs });
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

// PROTECTED ROUTES

// get a specific authors blogs
router.get("/my_blogs", checkAuth, async (req, res) => {
  try {
    const author = req.author.id;
    const blogs = await Blog.find({ author }).sort({ updatedAt: -1 });

    if (!blogs) {
      return res.status(422).send({
        errors: [
          {
            msg: "No Blogs Found",
          },
        ],
      });
    }
    res.json({ blogs });
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

// create a blog
router.post(
  "/create",
  [
    checkAuth,
    upload.single("image"),
    [
      check("title", "Title Must not be empty").notEmpty(),
      check("category", "Category Must not be empty").notEmpty(),
      check("body", "Body Must not be empty").notEmpty(),
    ],
  ],
  async (req, res) => {
    try {
      const author = req.author.id;
      const { title, category, body } = req.body;

      if (!req.file) {
        return res.status(422).send({
          errors: [
            {
              msg: "Image Submission Error",
            },
          ],
        });
      }
      const imageUrl = "/" + req.file.destination + "/" + req.file.filename;

      // validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).send({
          errors: errors.array(),
        });
      }

      const newBlog = new Blog({
        author,
        title,
        category,
        imageUrl,
        body,
      });

      const blog = await newBlog.save();

      res.json({ blog });
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

// delete blog
router.delete("/delete_blog/:id", checkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const author = req.author;
    const blog = await Blog.findById(id);

    if (author.id == blog.author) {
      const imageLink = "." + blog.imageUrl;
      fs.unlink(imageLink, (err) => {
        if (err) {
          return res.status(500).send({
            errors: [
              {
                msg: "Can't Delete Blog Image",
              },
            ],
          });
        }
      });

      await blog.delete();
      res.status(200).json({
        msg: "Post deleted successfully",
      });
    } else {
      return res.status(400).json({
        errors: [
          {
            msg: "Action Not Allowed",
          },
        ],
      });
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
});

// update blog details
router.put(
  "/update_blog/:id",
  [
    checkAuth,
    upload.single("image"),
    [
      check("title", "Title Must not be empty").notEmpty(),
      check("category", "Category Must not be empty").notEmpty(),
      check("body", "Body Must not be empty").notEmpty(),
    ],
  ],
  async (req, res) => {
    try {
      const author = req.author.id;
      const { id } = req.params;
      const { title, category, body } = req.body;
      const blog = await Blog.findById(id);
      const imageLink = "." + blog.imageUrl;

      if (!blog) {
        return res.status(400).json({
          errors: [
            {
              msg: "Blog Not Found",
            },
          ],
        });
      }

      fs.unlink(imageLink, (err) => {
        if (err) {
          return res.status(500).send({
            errors: [
              {
                msg: "Blog Image Updating Error",
              },
            ],
          });
        }
      });

      // validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).send({
          errors: errors.array(),
        });
      }

      const imageUrl = "/" + req.file.destination + "/" + req.file.filename;
      const updatedBlog = await Blog.findByIdAndUpdate(id, {
        author,
        title,
        category,
        imageUrl,
        body,
      });

      res.json({ updatedBlog });
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
