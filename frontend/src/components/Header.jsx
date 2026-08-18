import React, { useState, useRef, useEffect } from 'react';
import {
  Link2,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

export const Header = ({
  user,
  onOpenAuth,
  onLogout,
  activeTab,
  setActiveTab
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
        setMobileNavOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );

      document.removeEventListener(
        'keydown',
        handleEscape
      );
    };
  }, []);

  // Close mobile menu when page changes
  useEffect(() => {
    setMobileNavOpen(false);
  }, [activeTab]);

  // Go to home
  const handleBrandClick = (e) => {
    e.preventDefault();

    if (setActiveTab) {
      setActiveTab('home');
    }

    setMobileNavOpen(false);
  };

  // Change page
  const handleNavClick = (tab) => {
    if (setActiveTab) {
      setActiveTab(tab);
    }

    setMobileNavOpen(false);
  };

  // Scroll to features
  const handleFeaturesClick = (e) => {
    e.preventDefault();

    document
      .querySelector('#features')
      ?.scrollIntoView({
        behavior: 'smooth'
      });

    setMobileNavOpen(false);
  };

  return (
    <header className="header">
      <div className="header-container">

        {/* Logo */}

        <a
          href="/"
          className="brand"
          onClick={handleBrandClick}
          aria-label="ShortX home"
        >
          <div className="brand-icon">
            <Link2 size={18} />
          </div>

          <span className="brand-text">
            Short
            <span className="brand-highlight">
              X
            </span>
          </span>
        </a>

        {/* Desktop Navigation */}

        <nav
          className="nav-links"
          aria-label="Main navigation"
        >
          <button
            className={`nav-tab ${
              activeTab === 'home' ? 'active' : ''
            }`}
            onClick={() => handleNavClick('home')}
          >
            Shorten URL
          </button>

          {user && (
            <button
              className={`nav-tab ${
                activeTab === 'dashboard'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                handleNavClick('dashboard')
              }
            >
              <LayoutDashboard size={14} />

              <span>My Links</span>
            </button>
          )}

          <a
            href="#features"
            className="nav-tab"
            onClick={handleFeaturesClick}
          >
            Features
          </a>
        </nav>

        {/* Header Actions */}

        <div className="header-actions">

          {user ? (

            /* Logged-in User */

            <div
              className="user-menu-wrapper"
              ref={dropdownRef}
            >
              <button
                className="user-profile-btn"
                onClick={() =>
                  setDropdownOpen(
                    (prev) => !prev
                  )
                }
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
                aria-label="Open user menu"
              >
                <div className="user-avatar">
                  {user.name
                    ? user.name
                        .charAt(0)
                        .toUpperCase()
                    : 'U'}
                </div>

                <span className="user-name">
                  {user.name}
                </span>

                <ChevronDown
                  size={14}
                  className={`arrow-icon ${
                    dropdownOpen ? 'open' : ''
                  }`}
                />
              </button>

              {/* User Dropdown */}

              {dropdownOpen && (
                <div
                  className="user-dropdown"
                  role="menu"
                  aria-label="User menu"
                >

                  <div className="user-info-head">
                    <span className="user-info-name">
                      {user.name}
                    </span>

                    <span className="user-info-email">
                      {user.email}
                    </span>
                  </div>

                  <div className="dropdown-divider" />

                  <button
                    className="dropdown-item"
                    onClick={() => {
                      handleNavClick(
                        'dashboard'
                      );

                      setDropdownOpen(false);
                    }}
                    role="menuitem"
                  >
                    <LayoutDashboard size={15} />

                    <span>My Links</span>
                  </button>

                  <button
                    className="dropdown-item logout"
                    onClick={() => {
                      onLogout();
                      setDropdownOpen(false);
                    }}
                    role="menuitem"
                  >
                    <LogOut size={15} />

                    <span>Log Out</span>
                  </button>

                </div>
              )}
            </div>

          ) : (

            /* Guest User */

            <div className="auth-buttons">

              <button
                className="btn-auth-secondary"
                onClick={() =>
                  onOpenAuth('login')
                }
              >
                Sign In
              </button>

              <button
                className="btn-auth-primary"
                onClick={() =>
                  onOpenAuth('register')
                }
              >
                Create an Account
              </button>

            </div>
          )}

          {/* Mobile Menu Button */}

          <button
            className="mobile-menu-toggle"
            onClick={() =>
              setMobileNavOpen(
                (prev) => !prev
              )
            }
            aria-label={
              mobileNavOpen
                ? 'Close menu'
                : 'Open menu'
            }
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>

        </div>
      </div>

      {/* Mobile Navigation */}

      {mobileNavOpen && (
        <nav
          className="mobile-nav"
          aria-label="Mobile navigation"
        >

          <button
            className={`mobile-nav-item ${
              activeTab === 'home'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              handleNavClick('home')
            }
          >
            Shorten URL
          </button>

          {user && (
            <button
              className={`mobile-nav-item ${
                activeTab === 'dashboard'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                handleNavClick('dashboard')
              }
            >
              <LayoutDashboard size={14} />

              <span>My Links</span>
            </button>
          )}

          <a
            href="#features"
            className="mobile-nav-item"
            onClick={handleFeaturesClick}
          >
            Features
          </a>

          {!user && (
            <>
              <button
                className="mobile-nav-item"
                onClick={() => {
                  onOpenAuth('login');
                  setMobileNavOpen(false);
                }}
              >
                Sign In
              </button>

              <button
                className="mobile-nav-item"
                onClick={() => {
                  onOpenAuth('register');
                  setMobileNavOpen(false);
                }}
              >
                Create an Account
              </button>
            </>
          )}

        </nav>
      )}
    </header>
  );
};