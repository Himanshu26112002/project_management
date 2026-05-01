const { validationResult } = require('express-validator');
const prisma = require('../utils/prisma');

const memberInclude = {
  include: { user: { select: { id: true, name: true, email: true } } },
};

const createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description } = req.body;
  try {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        members: { create: { userId: req.user.id, role: 'ADMIN' } },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: memberInclude,
        _count: { select: { tasks: true } },
      },
    });
    res.status(201).json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { members: { some: { userId: req.user.id } } },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: memberInclude,
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const getProject = async (req, res) => {
  const { projectId } = req.params;
  try {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });
    if (!member) return res.status(403).json({ message: 'Access denied' });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: memberInclude,
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ ...project, currentUserRole: member.role });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProject = async (req, res) => {
  const { projectId } = req.params;
  const { name, description } = req.body;
  try {
    const project = await prisma.project.update({
      where: { id: projectId },
      data: { name, description },
    });
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteProject = async (req, res) => {
  const { projectId } = req.params;
  try {
    await prisma.project.delete({ where: { id: projectId } });
    res.json({ message: 'Project deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const addMember = async (req, res) => {
  const { projectId } = req.params;
  const { email, role } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'No user found with that email' });

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });
    if (existing) return res.status(400).json({ message: 'User is already a member' });

    const member = await prisma.projectMember.create({
      data: { projectId, userId: user.id, role: role || 'MEMBER' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(member);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const removeMember = async (req, res) => {
  const { projectId, userId } = req.params;
  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project.ownerId === userId) {
      return res.status(400).json({ message: 'Cannot remove the project owner' });
    }
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
    res.json({ message: 'Member removed' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateMemberRole = async (req, res) => {
  const { projectId, userId } = req.params;
  const { role } = req.body;
  try {
    const member = await prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json(member);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createProject, getProjects, getProject,
  updateProject, deleteProject,
  addMember, removeMember, updateMemberRole,
};
