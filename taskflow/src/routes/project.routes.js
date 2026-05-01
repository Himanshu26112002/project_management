const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate, requireProjectRole } = require('../middleware/auth');
const {
  createProject, getProjects, getProject,
  updateProject, deleteProject,
  addMember, removeMember, updateMemberRole,
} = require('../controllers/project.controller');

router.use(authenticate);

router.get('/', getProjects);
router.post('/', [body('name').trim().notEmpty().withMessage('Project name is required')], createProject);
router.get('/:projectId', getProject);
router.put('/:projectId', requireProjectRole(['ADMIN']), [body('name').trim().notEmpty()], updateProject);
router.delete('/:projectId', requireProjectRole(['ADMIN']), deleteProject);

router.post('/:projectId/members', requireProjectRole(['ADMIN']), addMember);
router.delete('/:projectId/members/:userId', requireProjectRole(['ADMIN']), removeMember);
router.put('/:projectId/members/:userId', requireProjectRole(['ADMIN']), updateMemberRole);

router.use('/:projectId/tasks', require('./task.routes'));

module.exports = router;
