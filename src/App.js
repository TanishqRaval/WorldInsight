import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import './App.css';

function App() {
  // Initiate variables
  const [countries, setCountries] = useState([]); // List of countries
  const [populationData, setPopulationData] = useState([]); // Population data for cities
  const [searchTerm, setSearchTerm] = useState(''); // Search term input
  const [darkMode, setDarkMode] = useState(false); // Dark mode toggle
  const [bucketList, setBucketList] = useState([]); // User's bucket list of countries

  // Fetch data on component mount and load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme'); // Load saved theme from localStorage
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      setDarkMode(true);
    }
    fetchData(); // Fetch countries and population data
  }, []);

  // Save theme preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Fetch countries and population data from the backend (server.js)
  const fetchData = async () => {
    const [countriesRes, populationRes] = await Promise.all([
      fetch('http://localhost:5001/api/countries'),
      fetch('http://localhost:5001/api/population'),
    ]);
    const countriesData = await countriesRes.json();
    const populationData = await populationRes.json();

    if (countriesData.status === 'success' && populationData.status === 'success') {
      // Add flag data to each country
      const countriesWithFlags = await Promise.all(
          countriesData.data.map(async (country) => {
            const flagRes = await fetch('http://localhost:5001/api/flag', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ country: country.name }),
            });
            const flagData = await flagRes.json();
            return { ...country, flag: flagData.data?.flag || '/placeholder.png' };
          })
      );
      setCountries(countriesWithFlags); // Update countries state
      setPopulationData(populationData.data); // Update population data state
    }
  };

  // Toggle between dark mode and light mode
  const toggleDarkMode = () => {
    const lightMode = !darkMode;
    document.documentElement.setAttribute('data-theme', lightMode ? 'dark' : 'light');
    setDarkMode(lightMode); // Update dark mode state
  };

  // Add a country to the user's bucket list
  const addToBucketList = (countryName) => {
    if (!bucketList.includes(countryName)) {
      setBucketList([...bucketList, countryName]); // Add country if not already in the list
    }
  };

  // Filter countries based on the search term
  const filteredCountries = countries.filter(
      (country) =>
          country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          country.capital.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get population for a city's capital
  const getPopulationForCapital = (capital) =>
      populationData.find((city) => city.city.toLowerCase() === capital.toLowerCase())
          ?.populationCounts[0]?.value || 0;

  // Prepare data for the bar chart (Top 15 most populated countries)
  const chartData = filteredCountries
      .map((country) => ({
        name: country.name,
        population: getPopulationForCapital(country.capital),
      }))
      .filter((data) => data.population > 0) // Include only countries with valid population
      .sort((a, b) => b.population - a.population) // Sort by population (descending)
      .slice(0, 15); // Limit to top 15 countries

  return (
      <div className="app">
        {/* Header Section */}
        <header className="header">
          <h1 className="header-title">World Insight</h1>
          <div className="search-container">
            <input
                type="text"
                placeholder="Search countries or capitals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} // Update search term state
                className="search-input"
            />
          </div>
        </header>

        {/* Controls Section */}
        <div className="controls-container">
          {/* Bucket List Section */}
          <div className="bucket-list-container">
            <h2>Bucket List</h2>
            <ul>
              {bucketList.map((item, index) => (
                  <li key={index}>{item}</li> // Display items in the bucket list
              ))}
            </ul>
          </div>

          {/* Dark Mode Button */}
          <div className="dark-mode-container">
            <button className="toggle-theme" onClick={toggleDarkMode}>
              {darkMode ? 'Light Mode' : 'Dark Mode'} {/* Display current mode */}
            </button>
          </div>
        </div>

        {/* Main Content Section */}
        <div className="main-content">
          <div className="countries-grid">
            {filteredCountries.map((country, index) => (
                <div
                    key={index}
                    className="country-card"
                    onClick={() => addToBucketList(country.name)} // Add country to bucket list
                >
                  <div className="flag-container">
                    <img
                        src={country.flag || '/placeholder.png'}
                        alt={`${country.name} flag`}
                        className="country-flag"
                    />
                  </div>
                  <div className="country-info">
                    <h3>{country.name}</h3>
                    <p>Capital: {country.capital}</p>
                    <p>Population: {getPopulationForCapital(country.capital).toLocaleString()}</p>
                    <button
                        className="add-to-bucket-btn"
                        onClick={() => addToBucketList(country.name)} // Add to bucket list on button click
                    >
                      Add to Bucket List
                    </button>
                  </div>
                </div>
            ))}
          </div>

          {/* Bar Chart Section */}
          <div className="chart-container">
            <h2>Top 15 Most Populated Countries</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0} // Ensure all country names are displayed
                />
                <YAxis tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <Bar dataKey="population" fill="#2196F3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
  );
}
export default App;
