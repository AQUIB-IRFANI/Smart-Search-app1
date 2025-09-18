import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import DetailPage from "./pages/DetailPage";
import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/detail/:id" element={<DetailPage />} />
      </Routes>
    </>
  );
}

export default App;
