import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './App.css';

function App() {
  const [countries, setCountries] = useState([]);
  const [populationData, setPopulationData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [bucketList, setBucketList] = useState([]); // Bucket List state

  useEffect(() => {
    fetchData();

    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      setDarkMode(true);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      setDarkMode(false);
    }
  }, []);

  useEffect(() => {
    // Save theme preference in localStorage
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [countriesRes, populationRes] = await Promise.all([
        fetch('http://localhost:5001/api/countries'),
        fetch('http://localhost:5001/api/population'),
      ]);

      const countriesData = await countriesRes.json();
      const populationData = await populationRes.json();

      if (countriesData.status === 'success' && populationData.status === 'success') {
        const countriesWithFlags = await Promise.all(
            countriesData.data.map(async (country) => {
              try {
                const flagRes = await fetch('http://localhost:5001/api/flag', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ country: country.name }),
                });
                const flagData = await flagRes.json();
                return { ...country, flag: flagData.data?.flag || '/placeholder.png' };
              } catch {
                return { ...country, flag: '/placeholder.png' }; // Use placeholder on error
              }
            })
        );
        setCountries(countriesWithFlags);
        setPopulationData(populationData.data);
      } else {
        throw new Error('Failed to fetch data from the server.');
      }
    } catch (err) {
      console.error('Fetch Data Error:', err.message);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => {
      const newMode = !prevMode;
      if (newMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
      return newMode;
    });
  };

  const addToBucketList = (countryName) => {
    if (!bucketList.includes(countryName)) {
      setBucketList((prevList) => [...prevList, countryName]);
    }
  };

  const filteredCountries = countries.filter(
      (country) =>
          country.name.toLowerCase().includes(searchTerm) ||
          country.capital.toLowerCase().includes(searchTerm)
  );

  const getPopulationForCapital = (capital) => {
    const cityData = populationData.find(
        (city) => city.city.toLowerCase() === capital.toLowerCase()
    );
    return cityData?.populationCounts[0]?.value || 0;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return (
        <div className="error">
          <p>{error}</p>
          <button onClick={fetchData}>Retry</button>
        </div>
    );
  }

  const chartData = filteredCountries
      .map((country) => ({
        name: country.name,
        population: getPopulationForCapital(country.capital),
      }))
      .filter((data) => data.population > 0) // Filter valid data
      .sort((a, b) => b.population - a.population) // Sort by population descending
      .slice(0, 20); // Display only the top 20 most populated countries

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
                onChange={handleSearch}
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
                  <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Dark Mode Button */}
          <div className="dark-mode-container">
            <button className="toggle-theme" onClick={toggleDarkMode}>
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="countries-grid">
            {filteredCountries.map((country, index) => (
                <div
                    key={index}
                    className={`country-card ${
                        selectedCountry === country ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedCountry(country)}
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
                    <p>
                      Population:{' '}
                      {getPopulationForCapital(country.capital).toLocaleString()}
                    </p>
                    <button
                        className="add-to-bucket-btn"
                        onClick={() => addToBucketList(country.name)}
                    >
                      Add to Bucket List
                    </button>
                  </div>
                </div>
            ))}
          </div>

          <div className="chart-container">
            <h2>Population Distribution</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="population" fill="#2196F3" name="Population" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
  );
}

export default App;
