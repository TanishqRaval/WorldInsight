const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Cache for API responses
let cache = {
  countries: null,
  populationData: null,
  flags: {},
  lastFetch: null,
};

// Cache duration (15 minutes)
const CACHE_DURATION = 15 * 60 * 1000;

// Function to check if the cache is valid
const isCacheValid = () => {
  return cache.lastFetch && Date.now() - cache.lastFetch < CACHE_DURATION;
};

// Fetch and cache all data from external APIs
const fetchAndCacheData = async () => {
  try {
    console.log('Fetching fresh data from external APIs...');
    const [countriesRes, populationRes] = await Promise.all([
      axios.get('https://countriesnow.space/api/v0.1/countries/capital'),
      axios.get('https://countriesnow.space/api/v0.1/countries/population/cities'),
    ]);

    // Validate the API responses
    if (countriesRes.data?.data && populationRes.data?.data) {
      cache.countries = countriesRes.data.data;
      cache.populationData = populationRes.data.data;
      cache.lastFetch = Date.now();
      console.log('Data successfully cached.');
    } else {
      console.error('Unexpected API response structure.');
      throw new Error('Unexpected API response structure.');
    }
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
};

// API Endpoint: Fetch countries with optional sorting
app.get('/api/countries', async (req, res) => {
  try {
    if (!isCacheValid()) {
      await fetchAndCacheData();
    }

    let countries = cache.countries;

    // Apply sorting
    const { sort } = req.query;
    if (sort === 'alphabetical') {
      countries.sort((a, b) => a.name.localeCompare(b.name));
    }

    res.json(countries);
  } catch (error) {
    console.error('Error in /api/countries endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch countries data' });
  }
});

// API Endpoint: Get population data
app.get('/api/population', async (req, res) => {
  try {
    if (!isCacheValid()) {
      await fetchAndCacheData();
    }
    if (!cache.populationData) {
      throw new Error('No population data available in cache.');
    }
    res.json({ status: 'success', data: cache.populationData });
  } catch (error) {
    console.error('Error fetching population:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API Endpoint: Fetch flag for a specific country
app.post('/api/flag', async (req, res) => {
  try {
    const { country } = req.body;

    if (!country) {
      return res.status(400).json({ status: 'error', message: 'Country name is required.' });
    }

    if (cache.flags[country]) {
      return res.json({ status: 'success', data: { flag: cache.flags[country] } });
    }

    const response = await axios.post('https://countriesnow.space/api/v0.1/countries/flag/images', {
      country,
    });

    if (response.data?.data?.flag) {
      cache.flags[country] = response.data.data.flag;
      return res.json({ status: 'success', data: { flag: response.data.data.flag } });
    } else {
      return res.status(404).json({ status: 'error', message: `Flag not found for ${country}.` });
    }
  } catch (error) {
    console.error(`Error fetching flag for ${req.body.country}:`, error.message);
    res.status(500).json({ status: 'error', message: 'Failed to fetch flag. Please try again later.' });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await fetchAndCacheData();
});

