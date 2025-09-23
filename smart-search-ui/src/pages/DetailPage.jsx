import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchEntryById } from "../services/api";

function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    async function loadEntry() {
      try {
        const data = await fetchEntryById(id);
        setEntry(data);
      } catch (err) {
        console.error("Error fetching detail:", err);
      }
    }
    loadEntry();
  }, [id]);

  if (!entry) return <p className="text-center mt-5">Loading...</p>;

  // Pick image field dynamically
  const imageUrl = entry.product_image || entry.image || null;

  return (
    <div className="container my-5">
      <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
        ⬅ Back
      </button>

      <div className="card">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={entry.title}
            className="card-img-top"
            style={{ objectFit: "cover", height: "400px" }}
          />
        )}
        <div className="card-body">
          <h3 className="card-title">{entry.title}</h3>

          {/* Products */}
          {entry.description && <p>{entry.description}</p>}
          {entry.price && (
            <p className="fw-bold text-success">₹ {entry.price}</p>
          )}

          {/* Blogs */}
          {entry.body && <p>{entry.body}</p>}
          {entry.author && <p className="text-muted">By {entry.author}</p>}
          {entry.publish_date && (
            <p className="text-muted">📅 {entry.publish_date}</p>
          )}

          {/* Events */}
          {entry.location && <p>📍 {entry.location}</p>}
          {entry.start_date && (
            <p className="text-muted">🟢 Starts: {entry.start_date}</p>
          )}
          {entry.end_date && (
            <p className="text-muted">🔴 Ends: {entry.end_date}</p>
          )}

          {/* Tags */}
          {entry.tags?.length > 0 && (
            <div className="mt-2">
              {entry.tags.map((tag, i) => (
                <span key={i} className="badge bg-secondary me-1">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetailPage;
