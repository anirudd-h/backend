const express = require('express');
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const router = express.Router();

router.get('/:userId/tasks', auth, async (req, res) => {
  try {
    if (req.params.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const tasks = await Task.find({ assignedUserId: req.params.userId })
      .populate('projectId', 'name')
      .populate('assignedUserId', 'email');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user tasks', error: err.message });
  }
});

module.exports = router;