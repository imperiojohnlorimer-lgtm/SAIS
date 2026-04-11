import jwt from 'jsonwebtoken';

export const generateToken = (userId, email, role, department = null) => {
  return jwt.sign(
    { userId, email, role, department },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

export default generateToken;
