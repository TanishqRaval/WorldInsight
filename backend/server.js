const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const worldInsight = express();
const port = process.env.PORT || 5001;

// Middleware
worldInsight.use(cors());
worldInsight.use(express.json());

// Setting up the API's given in the description
const countriesApiUrl = 'https://countriesnow.space/api/v0.1/countries/capital';
const populationApiUrl = 'https://countriesnow.space/api/v0.1/countries/population/cities';
const flagsApiUrl = 'https://countriesnow.space/api/v0.1/countries/flag/images';

// Fetch countries data from the Countries API
const getCountriesData = async () => {
  const response = await axios.get(countriesApiUrl);
  return response.data.data;
};

// Fetch population data from the Population API
const getPopulationData = async () => {
  const response = await axios.get(populationApiUrl);
  return response.data.data;
};

// Fetch flag for a specific country
const getCountryFlag = async (countryName) => {
  const response = await axios.post(flagsApiUrl, { country: countryName });
  return response.data.data.flag;
};

// API Endpoint: Fetch countries with sorting all the countries alphabetically
worldInsight.get('/api/countries', async (req, res) => {
  const countries = await getCountriesData();
  const { sort } = req.query;
  //logic for sorting alphabetically
  if (sort === 'alphabetical') {
    countries.sort((a, b) => a.name.localeCompare(b.name));
  }

  res.json({ status: 'success', data: countries });
});

// API Endpoint for fetching population
worldInsight.get('/api/population', async (req, res) => {
  const populationData = await getPopulationData();
  res.json({ status: 'success', data: populationData });
});

// API Endpoint for Fetching flag for a specific country
worldInsight.post('/api/flag', async (req, res) => {
  const { country } = req.body;

  if (!country) {
    res.status(400).json({ status: 'error', message: 'Country name is required.' });
    return;
  }

  const flag = await getCountryFlag(country);
  res.json({ status: 'success', data: { flag } });
});

// Start server
worldInsight.listen(port, () => {
  console.log(`WorldInsight server running on port ${port}`);
});
