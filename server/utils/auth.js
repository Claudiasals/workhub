import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Returns the JWT private key from environment variables
const getPrivateKey = () => process.env.SERVER_PRIVATE_KEY;

// Hash a plain text password using bcrypt
export const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

// Compare a plain text password with a bcrypt hash
export const comparePassword = async (password, hashed) => {
  return bcrypt.compare(password, hashed);
};

// Generate a signed JWT access token
export const generateAccessToken = (payload, expiresIn = "8h") => {
  const key = getPrivateKey();

  if (!key) {
    throw new Error("SERVER_PRIVATE_KEY is not defined in environment variables");
  }

  return jwt.sign(payload, key, { expiresIn });
};

// Verify and decode a JWT access token
export const verifyAccessToken = (token) => {
  const key = getPrivateKey();

  if (!key) {
    throw new Error("SERVER_PRIVATE_KEY is not defined in environment variables");
  }

  return jwt.verify(token, key);
};

// Generate a random temporary password
export const generateTempPassword = (length = 10) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
  let password = "";

  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
};
