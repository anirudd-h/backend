const express = require('express');
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Project = require('../models/Project');
const router = express.Router();

router.post('/:projectId/tasks', auth, async (req, res) => {
  const { title, description, dueDate, assignedUserId, priority } = req.body;
  try {
    const project = await Project.findOne({ _id: req.params.projectId, createdBy: req.user.userId });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const task = new Task({
      projectId: req.params.projectId,
      title,
      description,
      dueDate,
      assignedUserId,
      priority,
      status: 'not started',
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Error creating task', error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  const { status, priority, dueDate } = req.query;
  try {
    const query = { projectId: { $in: await Project.find({ createdBy: req.user.userId }).distinct('_id') } };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (dueDate) query.dueDate = { $lte: new Date(dueDate) };

    const tasks = await Task.find(query).populate('assignedUserId', 'email');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tasks', error: err.message });
  }
});

router.get('/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).populate('assignedUserId', 'email');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching task', error: err.message });
  }
});

router.put('/:taskId', auth, async (req, res) => {
  const { title, description, dueDate, priority } = req.body;
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.projectId);
    if (!project || project.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    task.title = title || task.title;
    task.description = description || task.description;
    task.dueDate = dueDate || task.dueDate;
    task.priority = priority || task.priority;
    task.updatedAt = Date.now();
    await task.save();

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Error updating task', error: err.message });
  }
});

router.delete('/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.projectId);
    if (!project || project.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await task.deleteOne();
    await Comment.deleteMany({ taskId: req.params.taskId });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting task', error: err.message });
  }
});

router.post('/:taskId/assign', auth, async (req, res) => {
  const { assignedUserId } = req.body;
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.projectId);
    if (!project || project.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    task.assignedUserId = assignedUserId;
    task.updatedAt = Date.now();
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Error assigning task', error: err.message });
  }
});

router.post('/:taskId/status', auth, async (req, res) => {
  const { status } = req.body;
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.projectId);
    if (!project || project.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    task.status = status;
    task.updatedAt = Date.now();
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Error updating task status', error: err.message });
  }
});

router.post('/:taskId/comments', auth, async (req, res) => {
  const { content } = req.body;
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const comment = new Comment({
      taskId: req.params.taskId,
      userId: req.user.userId,
      content,
    });
    await comment.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: 'Error adding comment', error: err.message });
  }
});

router.get('/:taskId/comments', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ taskId: req.params.taskId }).populate('userId', 'email');
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching comments', error: err.message });
  }
});

module.exports = router;