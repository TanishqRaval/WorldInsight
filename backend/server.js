const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const worldInsight = express();
const port = process.env.PORT || 5001;

// Middleware
worldInsight.use(cors());
worldInsight.use(express.json());

// External API URLs
const countriesApiUrl = 'https://countriesnow.space/api/v0.1/countries/capital';
const populationApiUrl = 'https://countriesnow.space/api/v0.1/countries/population/cities';
const flagsApiUrl = 'https://countriesnow.space/api/v0.1/countries/flag/images';

// Fetch countries data
const fetchCountriesData = async () => {
  try {
    const response = await axios.get(countriesApiUrl);
    return response.data.data;
  } catch (error) {
    throw new Error('Failed to fetch countries data.');
  }
};

// Fetch population data
const fetchPopulationData = async () => {
  try {
    const response = await axios.get(populationApiUrl);
    return response.data.data;
  } catch (error) {
    throw new Error('Failed to fetch population data.');
  }
};

// Fetch flag for a specific country
const fetchCountryFlag = async (countryName) => {
  try {
    const response = await axios.post(flagsApiUrl, { country: countryName });
    return response.data.data.flag || '/placeholder.png';
  } catch (error) {
    return '/placeholder.png'; // Fallback for missing flags
  }
};

// API: Fetch and optionally sort countries alphabetically
worldInsight.get('/api/countries', async (req, res) => {
  try {
    let countries = await fetchCountriesData();
    const { sort } = req.query;

    // Sort alphabetically if requested
    if (sort === 'alphabetical') {
      countries = countries.sort((a, b) => a.name.localeCompare(b.name));
    }

    res.json({ status: 'success', data: countries });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch countries data.' });
  }
});

// API: Fetch population data
worldInsight.get('/api/population', async (req, res) => {
  try {
    const populationData = await fetchPopulationData();
    res.json({ status: 'success', data: populationData });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch population data.' });
  }
});

// API: Fetch flag for a specific country
worldInsight.post('/api/flag', async (req, res) => {
  const { country } = req.body;

  if (!country) {
    return res.status(400).json({ status: 'error', message: 'Country name is required.' });
  }

  try {
    const flag = await fetchCountryFlag(country);
    res.json({ status: 'success', data: { flag } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch flag.' });
  }
});

// Start the server
worldInsight.listen(port, () => {
  console.log(`WorldInsight server is running on port ${port}`);
});
