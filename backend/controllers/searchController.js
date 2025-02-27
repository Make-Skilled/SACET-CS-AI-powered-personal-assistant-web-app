const Search = require('../models/Search');

// Save a new search
exports.saveSearch = async (req, res) => {
    try {
        const { text } = req.body;
        
        const search = new Search({
            user: req.user.id,
            text
        });

        await search.save();
        res.json(search);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Get user's last 10 searches
exports.getSearches = async (req, res) => {
    try {
        const searches = await Search.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(10);
        res.json(searches);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
