import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand fw-bold" to="/">
          🔍 Smart Search
        </Link>

        {/* Menu items */}
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Home
              </Link>
            </li>
            {/* Add more pages here later */}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
