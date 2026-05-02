const express = require('express');
const router = express.Router();
const { getAllReviews, getRepoSettings, upsertRepoSettings } = require('../services/database');

router.get('/reviews', (req, res) => {
  try {
    const reviews = getAllReviews();
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/settings/:repo', (req, res) => {
  try {
    const repoName = decodeURIComponent(req.params.repo);
    const settings = getRepoSettings(repoName) || {
      repo_name: repoName,
      strict_mode: 0,
      ignore_styling: 0,
      enabled: 1
    };
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/settings/:repo', express.json(), (req, res) => {
  try {
    const repoName = decodeURIComponent(req.params.repo);
    upsertRepoSettings(repoName, req.body);
    res.json({ message: 'Settings saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', (req, res) => {
  try {
    const reviews = getAllReviews();
    res.json({
      total_reviews: reviews.length,
      repos_monitored: [...new Set(reviews.map(r => r.repo_name))].length,
      latest_review: reviews[0] || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;