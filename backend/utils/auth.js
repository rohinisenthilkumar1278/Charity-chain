const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SALT_ROUNDS = 10;

function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function signToken({ id, role, email }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set in .env");
  return jwt.sign({ id, role, email }, secret, { expiresIn: "7d" });
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set in .env");
  return jwt.verify(token, secret);
}

module.exports = { hashPassword, comparePassword, signToken, verifyToken };
