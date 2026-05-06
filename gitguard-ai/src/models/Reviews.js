const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    repoName: String,
    prNumber: Number,
    analysis: String,
    status: { type: String, default: 'Analyzed' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reviews', reviewSchema);