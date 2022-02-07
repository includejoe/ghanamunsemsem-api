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
    const decoded = JWT.verify(token, SECRET_KEY);
    req.author = decoded;
    next();
  } catch (err) {
    return res.status(400).json({
      errors: [
        {
          msg: "Invalid/Expired Token",
        },
      ],
    });
  }
};
