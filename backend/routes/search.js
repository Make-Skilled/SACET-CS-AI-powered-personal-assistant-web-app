const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const searchController = require('../controllers/searchController');

// @route   POST api/search
// @desc    Save a new search
// @access  Private
router.post('/', auth, searchController.saveSearch);

// @route   GET api/search
// @desc    Get user's last 10 searches
// @access  Private
router.get('/', auth, searchController.getSearches);

// @route   DELETE api/search/:id
// @desc    Delete a search
// @access  Private
router.delete('/:id', auth, searchController.deleteSearch);

module.exports = router;
