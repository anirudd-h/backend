const express = require('express');
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');
const router = express.Router();

router.post('/', auth, async (req, res) => {
  const { name, description } = req.body;
  try {
    const project = new Project({ name, description, createdBy: req.user.userId });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: 'Error creating project', error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ createdBy: req.user.userId });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching projects', error: err.message });
  }
});

router.get('/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId, createdBy: req.user.userId });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const tasks = await Task.find({ projectId: req.params.projectId });
    res.json({ project, tasks });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching project', error: err.message });
  }
});

router.delete('/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.projectId, createdBy: req.user.userId });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await Task.deleteMany({ projectId: req.params.projectId });
    res.json({ message: 'Project and associated tasks deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting project', error: err.message });
  }
});

module.exports = router;