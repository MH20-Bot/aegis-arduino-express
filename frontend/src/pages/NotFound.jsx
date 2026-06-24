import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <section className="page-hero not-found-page">
      <div className="container">
        <span className="section-tag">
          Error 404
        </span>

        <h1>Page Not Found</h1>

        <p>
          The page you requested does not exist.
        </p>

        <Link
          to="/"
          className="primary-button"
        >
          Return Home
        </Link>
      </div>
    </section>
  );
}

export default NotFound;