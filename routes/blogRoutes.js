const router = require("express").Router();

const Blog = require("../models/blog");
const checkAuth = require("../middleware/checkAuth");
const upload = require("../middleware/upload");

// get all blogs
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json({ blogs });
  } catch (err) {
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
    throw new Error(err);
  }
});

// create a blog
router.post(
  "/create",
  [checkAuth, upload.single("image")],
  async (req, res) => {
    try {
      const { authorId, title, body } = req.body;
      const imageUrl = req.file.filename;

      if (req.author.id === authorId) {
        if (body.trim() === "") {
          return res.status(400).json({
            errors: [
              {
                msg: "Blog Must Not be empty",
              },
            ],
          });
        }

        const newBlog = new Blog({
          authorId,
          imageUrl,
          title,
          body,
        });

        const blog = await newBlog.save();

        res.json({ blog });
      } else {
        return res.status(400).json({
          errors: [
            {
              msg: "Authorization Error",
            },
          ],
        });
      }
    } catch (err) {
      throw new Error(err);
    }
  }
);

// // delete blog
// router.delete("/:id", checkAuth, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const blog = await Blog.findById();
//   } catch (err) {
//     throw new Error(err);
//   }
// });

module.exports = router;
