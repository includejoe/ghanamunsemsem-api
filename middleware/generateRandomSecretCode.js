const SecretCode = require("../models/secretCode");

function generateRandomSecretCode() {
  var randomChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var result = "";
  for (var i = 0; i < 7; i++) {
    result += randomChars.charAt(
      Math.floor(Math.random() * randomChars.length)
    );
  }
  return result;
}

module.exports = async () => {
  for (var i = 0; i < 15; i++) {
    const newCode = new SecretCode({
      code: generateRandomSecretCode(),
      used: false,
    });
    await newCode.save();
  }
};
