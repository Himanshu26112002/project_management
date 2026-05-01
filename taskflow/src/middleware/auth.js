const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-use-strong-secret-in-production';

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const requireProjectRole = (roles) => async (req, res, next) => {
  const { projectId } = req.params;
  try {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });
    if (!member || !roles.includes(member.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    req.projectMember = member;
    next();
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { authenticate, requireProjectRole, JWT_SECRET };
