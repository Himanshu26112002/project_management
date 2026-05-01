const prisma = require('../utils/prisma');

const getDashboard = async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  try {
    const projectIds = (
      await prisma.projectMember.findMany({
        where: { userId },
        select: { projectId: true },
      })
    ).map((m) => m.projectId);

    const [totalProjects, tasks, myTasks] = await Promise.all([
      prisma.project.count({ where: { id: { in: projectIds } } }),
      prisma.task.findMany({
        where: { projectId: { in: projectIds } },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.findMany({
        where: { projectId: { in: projectIds }, assigneeId: userId },
        include: { project: { select: { id: true, name: true } } },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
    ]);

    const todo = tasks.filter((t) => t.status === 'TODO').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    const overdue = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    ).length;

    res.json({
      stats: { totalProjects, totalTasks: tasks.length, todo, inProgress, done, overdue },
      myTasks,
      recentTasks: tasks.slice(0, 10),
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getDashboard };
