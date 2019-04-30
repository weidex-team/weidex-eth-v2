const ethers = require("ethers");

const wallet = new ethers.utils.SigningKey(
  "7477b9ef0f8fc7972809eb66c320f1a652afdc7663ffe71e54c983e167aa7f47"
);

function sign(hash) {
  const sig = wallet.signDigest(hash);
  return ethers.utils.joinSignature(sig);
}

module.exports = {
  sign
};
