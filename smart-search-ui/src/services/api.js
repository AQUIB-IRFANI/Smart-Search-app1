import axios from "axios";

const API_BASE = "http://localhost:4000";

// 🔍 Search endpoint
export async function searchEntries(q, type) {
  const res = await axios.get(`${API_BASE}/search`, {
    params: { q, type },
  });
  return res.data;
}

// 📄 Detail endpoint
export async function fetchEntryById(id) {
  const res = await axios.get(`${API_BASE}/detail/${id}`);
  return res.data;
}
