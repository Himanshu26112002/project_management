const { validationResult } = require('express-validator');
const prisma = require('../utils/prisma');

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  creator: { select: { id: true, name: true, email: true } },
};

const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { projectId } = req.params;
  const { title, description, status, priority, dueDate, assigneeId } = req.body;
  try {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });
    if (!member) return res.status(403).json({ message: 'Access denied' });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        creatorId: req.user.id,
      },
      include: taskInclude,
    });
    res.status(201).json(task);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateTask = async (req, res) => {
  const { projectId, taskId } = req.params;
  const { title, description, status, priority, dueDate, assigneeId } = req.body;
  try {
    const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });
    if (!member) return res.status(403).json({ message: 'Access denied' });

    const isAdmin = member.role === 'ADMIN';
    const isCreatorOrAssignee = task.creatorId === req.user.id || task.assigneeId === req.user.id;

    if (!isAdmin && !isCreatorOrAssignee && status === undefined) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title ?? task.title,
        description: description !== undefined ? description : task.description,
        status: status ?? task.status,
        priority: priority ?? task.priority,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
        assigneeId: assigneeId !== undefined ? (assigneeId || null) : task.assigneeId,
      },
      include: taskInclude,
    });
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteTask = async (req, res) => {
  const { projectId, taskId } = req.params;
  try {
    const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });
    const isAdmin = member?.role === 'ADMIN';
    const isCreator = task.creatorId === req.user.id;
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    await prisma.task.delete({ where: { id: taskId } });
    res.json({ message: 'Task deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createTask, updateTask, deleteTask };
