import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { UrlShortenerForm } from './components/UrlShortenerForm';
import { UrlResultCard } from './components/UrlResultCard';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './components/DashboardView';

import {
  Link2,
  Zap,
  Loader2,
  AlertCircle,
  ArrowRight,
  Layers,
  UserCheck,
  Shield,
  MousePointer,
  BarChart2
} from 'lucide-react';

import { apiFetch } from './utils/api';

// Features shown on the home page
const features = [
  {
    icon: <Zap size={20} />,
    title: 'Fast Link Redirects',
    desc: 'Your short links open quickly, so people can reach your page without waiting.'
  },
  {
    icon: <MousePointer size={20} />,
    title: 'Track Your Clicks',
    desc: 'See how many people clicked your links and check when they were created.'
  },
  {
    icon: <Shield size={20} />,
    title: 'Custom Short Links',
    desc: 'Create your own short link, like /my-portfolio, and set an expiry date if you want.'
  }
];

export default function App() {
  // ─────────────────────────────────────────────
  // AUTH STATE
  // ─────────────────────────────────────────────

  const [user, setUser] = useState(null);

  const [, setToken] = useState(() =>
    localStorage.getItem('shortx_token') || localStorage.getItem('slicelink_token') || null
  );

  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [authMode, setAuthMode] = useState('login');

  // ─────────────────────────────────────────────
  // APP STATE
  // ─────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState('home');

  const [currentResult, setCurrentResult] = useState(null);

  const [urls, setUrls] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  // ─────────────────────────────────────────────
  // AUTO HIDE ERROR
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [error]);

  // ─────────────────────────────────────────────
  // CHECK LOGIN
  // ─────────────────────────────────────────────

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('shortx_token') || localStorage.getItem('slicelink_token');

      // User is not logged in
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch('/api/auth/me');

        setUser(data.data);
        setToken(storedToken);
      } catch (err) {
        console.error('[Check Auth Error]', err);

        localStorage.removeItem('shortx_token');
        localStorage.removeItem('slicelink_token');

        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ─────────────────────────────────────────────
  // GET USER LINKS
  // ─────────────────────────────────────────────

  const fetchUrls = useCallback(
    async (showLoading = true) => {
      const currentToken = localStorage.getItem('shortx_token') || localStorage.getItem('slicelink_token');

      // Guest user
      if (!currentToken && !user) {
        setUrls([]);
        setLoading(false);
        return;
      }

      if (showLoading) {
        setLoading(true);
      }

      setError(null);

      try {
        const data = await apiFetch('/api/urls/user');

        setUrls(data.data || []);
      } catch (err) {
        console.error('[Fetch URLs Error]', err);

        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Load links whenever user changes
  useEffect(() => {
    fetchUrls();
  }, [fetchUrls, user]);

  // ─────────────────────────────────────────────
  // LOGIN / REGISTER SUCCESS
  // ─────────────────────────────────────────────

  const handleAuthSuccess = useCallback(
    (userData) => {
      setUser(userData);

      setToken(userData.token);

      localStorage.setItem(
        'shortx_token',
        userData.token
      );

      fetchUrls(false);
    },
    [fetchUrls]
  );

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────

  const handleLogout = useCallback(() => {
    localStorage.removeItem('shortx_token');
    localStorage.removeItem('slicelink_token');

    setToken(null);
    setUser(null);

    setUrls([]);
    setCurrentResult(null);

    setActiveTab('home');
  }, []);

  // ─────────────────────────────────────────────
  // OPEN LOGIN / REGISTER
  // ─────────────────────────────────────────────

  const handleOpenAuth = useCallback((mode = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  }, []);

  // ─────────────────────────────────────────────
  // URL SHORTEN SUCCESS
  // ─────────────────────────────────────────────

  const handleShortenSuccess = useCallback(
    (newUrlData) => {
      setCurrentResult(newUrlData);

      // Logged-in user
      if (user) {
        fetchUrls(false);
      } else {
        // Guest user
        // Keep the shortened link visible during this session
        setUrls((prev) => [
          newUrlData,
          ...prev.filter(
            (url) =>
              (url.id || url._id) !==
              (newUrlData.id || newUrlData._id)
          )
        ]);
      }
    },
    [fetchUrls, user]
  );

  // ─────────────────────────────────────────────
  // DELETE LINK
  // ─────────────────────────────────────────────

  const handleDelete = useCallback(
    async (id) => {
      const previousUrls = urls;

      // Remove from screen immediately
      setUrls((prev) =>
        prev.filter(
          (url) =>
            url.id !== id &&
            url.shortCode !== id
        )
      );

      try {
        await apiFetch(`/api/urls/${id}`, {
          method: 'DELETE'
        });

        if (
          currentResult &&
          (
            currentResult.id === id ||
            currentResult.shortCode === id
          )
        ) {
          setCurrentResult(null);
        }
      } catch (err) {
        console.error('[Delete URL Error]', err);

        // Restore old list if delete fails
        setUrls(previousUrls);

        setError(
          'Could not delete this link. Please try again.'
        );
      }
    },
    [urls, currentResult]
  );

  // ─────────────────────────────────────────────
  // GO TO URL SHORTENER
  // ─────────────────────────────────────────────

  const handleShortenClick = useCallback(() => {
    setActiveTab('home');

    setTimeout(() => {
      const formElement =
        document.getElementById('create');

      if (formElement) {
        formElement.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }, 50);
  }, []);

  // ─────────────────────────────────────────────
  // CALCULATE LINK STATS
  // ─────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalClicks = urls.reduce(
      (sum, url) => sum + (url.clicks || 0),
      0
    );

    const activeLinks = urls.filter(
      (url) => url.isActive !== false
    ).length;

    const averageClicks =
      urls.length > 0
        ? (totalClicks / urls.length).toFixed(1)
        : '0';

    return {
      totalClicks,
      activeLinks,
      averageClicks
    };
  }, [urls]);

  // ─────────────────────────────────────────────
  // LOADING SCREEN
  // ─────────────────────────────────────────────

  if (loading && !user) {
    return (
      <div className="app-root">
        <div className="loader-container">
          <Loader2
            size={40}
            className="spinner"
          />

          <p>Loading ShortX...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // MAIN APP
  // ─────────────────────────────────────────────

  return (
    <div className="app-root">

      {/* HEADER */}

      <Header
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="app-container">

        {/* ERROR MESSAGE */}

        {error && (
          <div
            className="error-toast"
            role="alert"
          >
            <AlertCircle
              size={18}
              className="error-icon"
            />

            <div className="error-text">
              {error}
            </div>

            <button
              className="error-close-btn"
              onClick={() => setError(null)}
              aria-label="Close error message"
            >
              ×
            </button>
          </div>
        )}

        {/* ─────────────────────────────────────── */}
        {/* HOME PAGE */}
        {/* ─────────────────────────────────────── */}

        {activeTab === 'home' && (
          <div className="tab-content home-view">

            {/* HERO */}

            <section className="hero-section">

              <h1 className="hero-headline">
                Short Links. <br />

                <span className="accent-text">
                  Made Simple.
                </span>
              </h1>

              <p className="hero-lead">
                Turn long URLs into short, easy-to-share
                links. Create custom links and track your
                clicks with ease.
              </p>

              <div className="hero-cta-group">

                <a
                  href="#create"
                  className="btn-primary"
                  aria-label="Shorten your URL"
                >
                  <span>Shorten URL</span>

                  <ArrowRight size={16} />
                </a>

                {!user ? (
                  <button
                    className="btn-secondary"
                    onClick={() =>
                      handleOpenAuth('register')
                    }
                    aria-label="Create an account"
                  >
                    <UserCheck size={16} />

                    <span>
                      Create an Account
                    </span>
                  </button>
                ) : (
                  <button
                    className="btn-secondary"
                    onClick={() =>
                      setActiveTab('dashboard')
                    }
                    aria-label="Open my links"
                  >
                    <Layers size={16} />

                    <span>
                      My Links
                    </span>
                  </button>
                )}

              </div>
            </section>

            {/* URL SHORTENER */}

            <section
              id="create"
              className="slate-card form-section"
            >

              <div className="panel-header">

                <div className="panel-icon-box">
                  <Link2 size={18} />
                </div>

                <div>

                  <h2 className="panel-title">
                    Shorten Your URL
                  </h2>

                  <p className="panel-subtitle">
                    Paste your long URL below.
                  </p>

                </div>

              </div>

              <div className="form-inner-wrapper">

                <UrlShortenerForm
                  onShortenSuccess={
                    handleShortenSuccess
                  }
                  onError={(err) =>
                    setError(err.message)
                  }
                  user={user}
                  onOpenAuth={handleOpenAuth}
                />

              </div>

            </section>

            {/* RESULT */}

            {currentResult && (
              <section className="result-wrapper-section">

                <UrlResultCard
                  data={currentResult}
                />

              </section>
            )}

            {/* LINK STATS */}

            {urls.length > 0 && (
              <section className="analytics-section">

                <div className="analytics-grid">

                  <div className="stat-card">

                    <div className="stat-card-head">

                      <span className="stat-label">
                        Total Links
                      </span>

                      <div className="stat-icon-box blue">
                        <Link2 size={16} />
                      </div>

                    </div>

                    <div className="stat-value">
                      {urls.length}
                    </div>

                    <span className="stat-subtext">
                      Active links and expiry dates
                    </span>

                  </div>

                  {/* TOTAL CLICKS */}

                  <div className="stat-card">

                    <div className="stat-card-head">

                      <span className="stat-label">
                        Total Clicks
                      </span>

                      <div className="stat-icon-box teal">
                        <MousePointer size={16} />
                      </div>

                    </div>

                    <div className="stat-value">
                      {stats.totalClicks.toLocaleString()}
                    </div>

                    <span className="stat-subtext">
                      Total clicks on your links
                    </span>

                  </div>

                  {/* AVERAGE CLICKS */}

                  <div className="stat-card">

                    <div className="stat-card-head">

                      <span className="stat-label">
                        Avg. Clicks per Link
                      </span>

                      <div className="stat-icon-box blue">
                        <BarChart2 size={16} />
                      </div>

                    </div>

                    <div className="stat-value">
                      {stats.averageClicks}
                    </div>

                    <span className="stat-subtext">
                      Average clicks per link
                    </span>

                  </div>

                </div>

              </section>
            )}

            <section
              id="features"
              className="features-section"
            >

              <div className="features-header">

                <h2 className="section-title">
                  Simple, Fast & Easy to Use
                </h2>

                <p className="section-subtitle">
                  Shorten, manage, and track all your
                  links in one place.
                </p>

              </div>

              <div className="features-grid">

                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="feature-card"
                  >

                    <div className="feature-icon-wrapper">
                      {feature.icon}
                    </div>

                    <h3 className="feature-heading">
                      {feature.title}
                    </h3>

                    <p className="feature-body">
                      {feature.desc}
                    </p>

                  </div>
                ))}

              </div>

            </section>

          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="tab-content dashboard-view">

            <DashboardView
              user={user}
              urls={urls}
              onDelete={handleDelete}
              onUpdate={() => fetchUrls(false)}
              onShortenClick={handleShortenClick}
              onOpenAuth={handleOpenAuth}
            />

          </div>
        )}

      </main>


      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-logo">
              <Link2 size={16} />
            </div>
            <span className="brand-text">
              ShortX
            </span>
          </div>
          <div className="footer-links">
            <button
              onClick={() =>
                setActiveTab('home')
              }
              className="footer-link-btn"
              aria-label="Go to shorten page"
            >
              Shorten
            </button>
            <button
              onClick={() =>
                setActiveTab('dashboard')
              }
              className="footer-link-btn"
              aria-label="Open my links"
            >
              My Links
            </button>
            {user ? (
              <button
                onClick={handleLogout}
                className="footer-link-btn"
                aria-label="Log out"
              >
                Log Out
              </button>
            ) : (
              <button
                onClick={() =>
                  handleOpenAuth('login')
                }
                className="footer-link-btn"
                aria-label="Sign in"
              >
                Sign In
              </button>
            )}

          </div>

          <div className="footer-copyright">
            © {new Date().getFullYear()} ShortX.
          </div>

        </div>

      </footer>

      {/* AUTH MODAL */}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() =>
          setIsAuthOpen(false)
        }
        onAuthSuccess={handleAuthSuccess}
        initialMode={authMode}
      />

    </div>
  );
}