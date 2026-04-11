import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth middleware - header present:', !!authHeader);
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is missing',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Auth middleware - no token in header');
      return res.status(401).json({
        success: false,
        message: 'Token is missing from Authorization header',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - decoded token:', { userId: decoded.userId, role: decoded.role });
    
    // Map userId to _id for consistency with MongoDB
    req.user = {
      _id: decoded.userId,
      id: decoded.userId,
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      department: decoded.department,
    };
    
    console.log('Auth middleware - req.user set:', { _id: req.user._id, role: req.user.role });
    next();
  } catch (error) {
    console.error('Auth middleware - error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or malformed token',
    });
  }
};

export default authMiddleware;
