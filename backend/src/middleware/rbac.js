// RBAC Middleware - Role-Based Access Control
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    console.log('RBAC middleware - user:', req.user ? { userId: req.user.userId, role: req.user.role } : 'not set');
    console.log('RBAC middleware - allowed roles:', allowedRoles);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log('RBAC middleware - access denied. User role does not match allowed roles');
      return res.status(403).json({
        success: false,
        message: `Access denied. Your role: ${req.user.role}. Required role(s): ${allowedRoles.join(', ')}`,
      });
    }

    console.log('RBAC middleware - access granted');
    next();
  };
};

export default authorize;
