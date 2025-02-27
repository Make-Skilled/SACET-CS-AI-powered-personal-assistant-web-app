import React, { useState, useEffect } from 'react';
import { getSearchHistory } from '../services/searchService';

const Dashboard = () => {
    const [searches, setSearches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadSearchHistory();
    }, []);

    const loadSearchHistory = async () => {
        try {
            const data = await getSearchHistory();
            setSearches(data);
            setLoading(false);
        } catch (err) {
            setError(err.message || 'Failed to load search history');
            setLoading(false);
        }
    };

    const handleReuse = (text) => {
        const lowerText = text.toLowerCase();
        const commands = {
            'open youtube': 'https://youtube.com',
            'open facebook': 'https://facebook.com',
            'open twitter': 'https://twitter.com',
            'open instagram': 'https://instagram.com',
            'open linkedin': 'https://linkedin.com',
            'open github': 'https://github.com',
            'open netflix': 'https://netflix.com',
            'open amazon': 'https://amazon.com',
            'open spotify': 'https://spotify.com',
            'open gmail': 'https://gmail.com',
            'check weather': 'https://weather.com'
        };

        // Check if it matches any command
        for (const [command, url] of Object.entries(commands)) {
            if (lowerText.includes(command)) {
                window.open(url, '_blank');
                return;
            }
        }

        // If no command matches, perform a Google search
        const searchQuery = encodeURIComponent(text);
        window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 mt-16">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Recent Searches
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Your last 10 voice-to-text conversions
                        </p>
                    </div>
                    <div className="border-t border-gray-200">
                        {searches.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {searches.map((search) => (
                                    <li key={search._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 pr-4">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {search.text}
                                                </p>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    {new Date(search.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <button
                                                    onClick={() => handleReuse(search.text)}
                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    <svg 
                                                        xmlns="http://www.w3.org/2000/svg" 
                                                        className="h-4 w-4 mr-1" 
                                                        fill="none" 
                                                        viewBox="0 0 24 24" 
                                                        stroke="currentColor"
                                                    >
                                                        <path 
                                                            strokeLinecap="round" 
                                                            strokeLinejoin="round" 
                                                            strokeWidth={2} 
                                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                                                        />
                                                    </svg>
                                                    Reuse
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                                No searches found. Start using voice navigation to see your history here.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
