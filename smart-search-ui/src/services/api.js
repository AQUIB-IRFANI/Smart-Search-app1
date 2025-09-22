import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// 🔍 Search endpoint
export async function searchEntries(q, type) {
  const res = await axios.get(`${API_BASE}/search`, {
    params: { q, type },
  });
  return res.data;
}

// 📄 Detail endpoint
export async function fetchEntryById(id) {
  const res = await axios.get(`${API_BASE}/item/${id}`);
  return res.data;
}
