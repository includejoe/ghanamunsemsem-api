const JWT = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

module.exports = async (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(400).json({
      errors: [
        {
          msg: "No token found",
        },
      ],
    });
  }

  try {
    let author = JWT.verify(token, SECRET_KEY);
    req.author = author;
    next();
  } catch (err) {
    return res.status(400).json({
      errors: [
        {
          msg: "Token Invalid",
        },
      ],
    });
  }
};
