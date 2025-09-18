import { useState, useCallback } from "react";
import debounce from "lodash.debounce";
import SearchResults from "../components/SearchResults";
import { searchEntries } from "../services/api";

function HomePage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchResults = useCallback(
    debounce(async (q, t) => {
      if (!q) {
        setResults([]);
        return;
      }
      try {
        setLoading(true);
        const data = await searchEntries(q, t);
        setResults(data);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    fetchResults(value, type);
  };

  const handleTypeChange = (e) => {
    const value = e.target.value;
    setType(value);
    fetchResults(query, value);
  };

  return (
    <div className="container my-5">
      <h1 className="mb-4 text-center">🔍 Smart Search</h1>

      <div className="row g-2 justify-content-center mb-4">
        <div className="col-md-6">
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={handleInputChange}
            className="form-control"
          />
        </div>
        <div className="col-md-2">
          <select
            value={type}
            onChange={handleTypeChange}
            className="form-select"
          >
            <option value="">All</option>
            <option value="products">Products</option>
            <option value="blogs">Blogs</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <SearchResults results={results} />
      )}
    </div>
  );
}

export default HomePage;
