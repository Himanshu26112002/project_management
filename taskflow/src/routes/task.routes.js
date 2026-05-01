const router = require('express').Router({ mergeParams: true });
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { createTask, updateTask, deleteTask } = require('../controllers/task.controller');

router.use(authenticate);

router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
], createTask);

router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);

module.exports = router;
