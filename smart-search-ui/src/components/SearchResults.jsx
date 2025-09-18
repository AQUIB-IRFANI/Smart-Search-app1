/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";

function SearchResults({ results }) {
  if (!results.length) {
    return <p className="text-center mt-4">No results found.</p>;
  }

  return (
    <div className="row g-4">
      {results.map((item) => (
        <div key={item.id} className="col-md-4">
          <div className="card h-100">
            <Link to={`/detail/${item.id}`}>
              {item.metadata.content_type === "products" &&
                item.metadata.product_image && (
                  <img
                    src={item.metadata.product_image}
                    className="card-img-top"
                    alt={item.metadata.title}
                    style={{ objectFit: "cover", height: "200px" }}
                  />
                )}
              {item.metadata.content_type === "blogs" &&
                item.metadata.image && (
                  <img
                    src={item.metadata.image}
                    className="card-img-top"
                    alt={item.metadata.title}
                    style={{ objectFit: "cover", height: "200px" }}
                  />
                )}
            </Link>

            <div className="card-body d-flex flex-column">
              <h5 className="card-title">
                <Link
                  to={`/detail/${item.id}`}
                  className="text-decoration-none text-dark"
                >
                  {item.metadata.title}
                </Link>
              </h5>

              {item.metadata.content_type === "products" ? (
                <>
                  <p className="card-text">{item.metadata.description}</p>
                  <p className="fw-bold text-success">
                    ₹ {item.metadata.price}
                  </p>
                  <p className="text-muted">
                    Category: {item.metadata.category}
                  </p>
                </>
              ) : (
                <>
                  <p className="card-text">{item.metadata.body}</p>
                  <p className="text-muted">
                    By {item.metadata.author} | {item.metadata.publish_date}
                  </p>
                </>
              )}

              {item.metadata.tags?.length > 0 && (
                <div className="mt-auto">
                  {item.metadata.tags.map((tag, i) => (
                    <span key={i} className="badge bg-secondary me-1">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* <div className="mt-3">
                <Link to={`/detail/${item.id}`} className="btn btn-primary">
                  Read More →
                </Link>
              </div> */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SearchResults;
