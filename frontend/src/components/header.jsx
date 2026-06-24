import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldPlus,
  X
} from 'lucide-react';

import {
  Link,
  NavLink,
  useLocation,
  useNavigate
} from 'react-router-dom';

import {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  useAuth
} from '../context/AuthContext.jsx';

import {
  features
} from '../data/features.js';

function Header() {
  const {
    user,
    loading,
    logout
  } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    mobileMenuOpen,
    setMobileMenuOpen
  ] = useState(false);

  const [
    featureMenuOpen,
    setFeatureMenuOpen
  ] = useState(false);

  const dropdownRef =
    useRef(null);

  useEffect(() => {
    function handleOutsideClick(
      event
    ) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target
        )
      ) {
        setFeatureMenuOpen(
          false
        );
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setFeatureMenuOpen(false);
  }, [location.pathname]);

  function closeMenus() {
    setMobileMenuOpen(false);
    setFeatureMenuOpen(false);
  }

  function getFeatureUrl(
    feature
  ) {
    return `/app/features/${feature.slug}`;
  }

  async function handleLogout() {
    try {
      await logout();

      closeMenus();

      navigate('/', {
        replace: true
      });
    } catch (error) {
      console.error(
        'Logout failed:',
        error.message
      );
    }
  }

  return (
    <header className="site-header">
      <div className="container header-container">
        <Link
          to="/"
          className="brand-logo"
          onClick={closeMenus}
        >
          <span className="brand-icon">
            <ShieldPlus size={26} />
          </span>

          <span>
            <strong>
              AEGIS
            </strong>

            <small>
              Health Assistant
            </small>
          </span>
        </Link>

        <button
          type="button"
          className="mobile-menu-button"
          aria-label="Toggle navigation"
          aria-expanded={
            mobileMenuOpen
          }
          onClick={() =>
            setMobileMenuOpen(
              previous =>
                !previous
            )
          }
        >
          {mobileMenuOpen ? (
            <X size={24} />
          ) : (
            <Menu size={24} />
          )}
        </button>

        <nav
          className={`main-navigation ${
            mobileMenuOpen
              ? 'open'
              : ''
          }`}
        >
          <NavLink
            to="/"
            end
            onClick={closeMenus}
          >
            Home
          </NavLink>

          <NavLink
            to="/about"
            onClick={closeMenus}
          >
            About Us
          </NavLink>

          <NavLink
            to="/contact"
            onClick={closeMenus}
          >
            Contact
          </NavLink>

          <div
            className="feature-dropdown"
            ref={dropdownRef}
          >
            <button
              type="button"
              className="feature-dropdown-button"
              aria-haspopup="menu"
              aria-expanded={
                featureMenuOpen
              }
              onClick={() =>
                setFeatureMenuOpen(
                  previous =>
                    !previous
                )
              }
            >
              <span>
                Features
              </span>

              <ChevronDown
                size={16}
                className={
                  featureMenuOpen
                    ? 'rotate'
                    : ''
                }
              />
            </button>

            {featureMenuOpen && (
              <div
                className="feature-dropdown-menu"
                role="menu"
              >
                {features.map(
                  feature => {
                    const Icon =
                      feature.icon;

                    return (
                      <Link
                        key={
                          feature.slug
                        }
                        to={getFeatureUrl(
                          feature
                        )}
                        role="menuitem"
                        onClick={
                          closeMenus
                        }
                      >
                        {Icon && (
                          <Icon
                            size={18}
                          />
                        )}

                        <span>
                          {feature.title}
                        </span>
                      </Link>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {user && (
            <NavLink
              to="/dashboard"
              className="mobile-auth-link"
              onClick={closeMenus}
            >
              Dashboard
            </NavLink>
          )}
        </nav>

        {!loading && (
          <div className="header-auth-actions">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="dashboard-header-button"
                  onClick={closeMenus}
                >
                  <LayoutDashboard
                    size={17}
                  />

                  <span>
                    Dashboard
                  </span>
                </Link>

                <button
                  type="button"
                  className="logout-header-button"
                  onClick={
                    handleLogout
                  }
                >
                  <LogOut size={17} />

                  <span>
                    Logout
                  </span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="header-login-button"
                onClick={closeMenus}
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
