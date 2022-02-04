const router = require("express").Router();
const fs = require("fs");

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
router.get("/:id", async (req, res) => {
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

// AUTHENTICATION NEEDED

// get a specific authors blogs
router.get("/my_blogs", checkAuth, async (req, res) => {
  try {
    const author = req.author;
    const blogs = await Blog.find({ author }).sort({ createdAt: -1 });

    if (!blogs) {
      return res.status(422).send({
        errors: [
          {
            msg: "Can't find blogs",
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
  [checkAuth, upload.single("image")],
  async (req, res) => {
    try {
      const { author, title, category, body } = req.body;
      const imageUrl = "/" + req.file.destination + "/" + req.file.filename;

      if (title.trim() === "") {
        return res.status(422).send({
          errors: [
            {
              msg: "Title must not be empty",
            },
          ],
        });
      }

      if (category.trim() === "") {
        return res.status(422).send({
          errors: [
            {
              msg: "Category Must Not be empty",
            },
          ],
        });
      }

      if (body.trim() === "") {
        return res.status(422).send({
          errors: [
            {
              msg: "Body Must Not be empty",
            },
          ],
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
router.delete("/:id", checkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const author = req.author;
    const blog = await Blog.findById(id);

    if (author.id === blog.author) {
      await Blog.delete();
      const { imageUrl } = blog;
      fs.unlink(imageUrl, (err) => {
        if (err) {
          return res.status(500).send({
            errors: [
              {
                msg: "Blog image deletion error",
              },
            ],
          });
        }
      });

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
  "/update_blog",
  [checkAuth, upload.single("image")],
  async (req, res) => {
    try {
      const { id, author, title, category, body } = req.body;
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

      if (title.trim() === "") {
        return res.status(422).send({
          errors: [
            {
              msg: "Title must not be empty",
            },
          ],
        });
      }

      if (category.trim() === "") {
        return res.status(422).send({
          errors: [
            {
              msg: "Category Must Not be empty",
            },
          ],
        });
      }

      if (body.trim() === "") {
        return res.status(422).send({
          errors: [
            {
              msg: "Body Must Not be empty",
            },
          ],
        });
      }

      if (req.file) {
        const imageUrl = "/" + req.file.destination + "/" + req.file.filename;
        const updatedBlog = {
          id,
          author,
          title,
          category,
          imageUrl,
          body,
        };

        Object.assign(author, updatedBlog);
        blog.save();
      } else {
        const updatedBlog = {
          id,
          author,
          title,
          category,
          body,
        };

        Object.assign(author, updatedBlog);
        blog.save();
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
