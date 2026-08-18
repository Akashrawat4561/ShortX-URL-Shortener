import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  ArrowRight,
  Loader2,
  Link2,
  CheckCircle2
} from 'lucide-react';
import { apiFetch } from '../utils/api';

export const AuthModal = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setLoading(true);

    try {
      const endpoint =
        mode === 'login'
          ? '/api/auth/login'
          : '/api/auth/register';

      const body =
        mode === 'login'
          ? {
              email,
              password
            }
          : {
              name,
              email,
              password
            };

      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      onAuthSuccess(data.data);
      onClose();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError(null);
  };

  return (
    <div
      className="auth-overlay"
      onClick={onClose}
    >
      <div
        className="auth-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="auth-modal">

          {/* Header */}
          <div className="auth-header">

            <div className="auth-title-brand">

              <div className="auth-logo">
                <Link2 size={17} />
              </div>

              <div className="auth-title-wrapper">
                <span className="auth-brand-text">
                  Short<span>X</span>
                </span>

                <small>
                  {mode === 'login'
                    ? 'Welcome back'
                    : 'Create your account'}
                </small>
              </div>

            </div>

            <button
              className="close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>

          </div>

          {/* Login / Register Tabs */}
          <div className="tab-switcher">

            <button
              className={`tab-btn ${
                mode === 'login' ? 'active' : ''
              }`}
              onClick={() => switchMode('login')}
            >
              Sign In
            </button>

            <button
              className={`tab-btn ${
                mode === 'register' ? 'active' : ''
              }`}
              onClick={() => switchMode('register')}
            >
              Create Account
            </button>

          </div>

          {/* Error */}
          {error && (
            <div className="auth-error-alert">
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >

            {/* Name */}
            {mode === 'register' && (
              <div className="form-group">

                <label htmlFor="name">
                  Full Name
                </label>

                <div className="input-with-icon">

                  <User
                    size={16}
                    className="field-icon"
                  />

                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                  />

                </div>

              </div>
            )}

            {/* Email */}
            <div className="form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <div className="input-with-icon">

                <Mail
                  size={16}
                  className="field-icon"
                />

                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />

              </div>

            </div>

            {/* Password */}
            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="input-with-icon">

                <Lock
                  size={16}
                  className="field-icon"
                />

                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

              </div>

              {mode === 'register' && (
                <span className="password-hint">
                  Use at least 6 characters.
                </span>
              )}

            </div>

            {/* Submit */}
            <button
              type="submit"
              className="submit-auth-btn"
              disabled={loading}
            >

              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="spinning"
                  />

                  <span>
                    Please wait...
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'login'
                      ? 'Sign In'
                      : 'Create Account'}
                  </span>

                  <ArrowRight size={16} />
                </>
              )}

            </button>

          </form>

          {/* Features */}
          <div className="auth-features-list">

            <div className="feat-item">

              <CheckCircle2
                size={14}
                className="feat-check"
              />

              <span>
                Create custom short links
              </span>

            </div>

            <div className="feat-item">

              <CheckCircle2
                size={14}
                className="feat-check"
              />

              <span>
                Manage all your links in one place
              </span>

            </div>

            <div className="feat-item">

              <CheckCircle2
                size={14}
                className="feat-check"
              />

              <span>
                Track clicks and link activity
              </span>

            </div>

          </div>

          {/* Bottom Text */}
          <div className="auth-bottom-text">

            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => switchMode('register')}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => switchMode('login')}
                >
                  Sign in
                </button>
              </>
            )}

          </div>

        </div>
      </div>

      <style jsx>{`

        /* ================================
           AUTH OVERLAY
        ================================= */

        .auth-overlay {
          position: fixed;
          inset: 0;
          z-index: 1100;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;

          background: rgba(3, 7, 18, 0.82);

          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);

          animation: overlayFade 0.2s ease;
        }

        @keyframes overlayFade {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }


        /* ================================
           CONTAINER
        ================================= */

        .auth-container {
          width: 100%;
          max-width: 420px;

          animation: modalIn 0.25s ease;
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }


        /* ================================
           MODAL
        ================================= */

        .auth-modal {
          background: #111827;

          border: 1px solid #263247;

          border-radius: 18px;

          padding: 26px;

          box-shadow:
            0 25px 60px rgba(0, 0, 0, 0.45),
            0 0 0 1px rgba(255, 255, 255, 0.02);

          color: #F8FAFC;
        }


        /* ================================
           HEADER
        ================================= */

        .auth-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 20px;
        }

        .auth-title-brand {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .auth-logo {
          width: 36px;
          height: 36px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 10px;

          background: linear-gradient(
            135deg,
            #48484eff,
            #403853ff
          );

          color: #FFFFFF;

          box-shadow:
            0 6px 18px rgba(99, 102, 241, 0.25);
        }

        .auth-title-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .auth-brand-text {
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -0.4px;
          color: #F8FAFC;
        }

        .auth-brand-text span {
          color: #72737cff;
        }

        .auth-title-wrapper small {
          font-size: 11px;
          color: #64748B;
        }


        /* ================================
           CLOSE BUTTON
        ================================= */

        .close-btn {
          width: 32px;
          height: 32px;

          display: flex;
          align-items: center;
          justify-content: center;

          background: transparent;

          border: 1px solid transparent;

          border-radius: 8px;

          color: #64748B;

          cursor: pointer;

          transition: all 0.15s ease;
        }

        .close-btn:hover {
          color: #F8FAFC;

          background: #1E293B;

          border-color: #334155;
        }


        /* ================================
           TABS
        ================================= */

        .tab-switcher {
          display: flex;

          padding: 4px;

          margin-bottom: 20px;

          background: #0B1120;

          border: 1px solid #263247;

          border-radius: 10px;
        }

        .tab-btn {
          flex: 1;

          padding: 9px 10px;

          border: none;

          background: transparent;

          color: #64748B;

          font-size: 13px;
          font-weight: 600;

          border-radius: 7px;

          cursor: pointer;

          transition: all 0.15s ease;
        }

        .tab-btn:hover {
          color: #CBD5E1;
        }

        .tab-btn.active {
          color: #FFFFFF;

          background: #575758ff;

          box-shadow:
            0 3px 10px rgba(99, 102, 241, 0.25);
        }


        /* ================================
           ERROR
        ================================= */

        .auth-error-alert {
          display: flex;
          align-items: center;

          padding: 10px 12px;

          margin-bottom: 15px;

          background: rgba(239, 68, 68, 0.08);

          border: 1px solid rgba(239, 68, 68, 0.22);

          border-radius: 9px;

          color: #FCA5A5;

          font-size: 12px;

          line-height: 1.4;
        }


        /* ================================
           FORM
        ================================= */

        .auth-form {
          display: flex;
          flex-direction: column;

          gap: 15px;
        }

        .form-group {
          display: flex;
          flex-direction: column;

          gap: 6px;
        }

        .form-group label {
          font-size: 12px;

          font-weight: 600;

          color: #CBD5E1;
        }

        .input-with-icon {
          position: relative;

          display: flex;
          align-items: center;
        }

        .field-icon {
          position: absolute;

          left: 12px;

          color: #64748B;

          pointer-events: none;

          transition: color 0.15s ease;
        }

        .input-with-icon:focus-within .field-icon {
          color: #3f425cff;
        }

        .input-with-icon input {
          width: 100%;

          height: 42px;

          padding: 0 12px 0 37px;

          background: #0B1120;

          border: 1px solid #263247;

          border-radius: 9px;

          color: #F8FAFC;

          font-size: 13px;

          outline: none;

          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            background 0.15s ease;
        }

        .input-with-icon input::placeholder {
          color: #475569;
        }

        .input-with-icon input:hover {
          border-color: #334155;
        }

        .input-with-icon input:focus {
          border-color: #2f2f3bff;

          background: #0D1424;

          box-shadow:
            0 0 0 3px rgba(99, 102, 241, 0.12);
        }

        .password-hint {
          font-size: 11px;

          color: #64748B;
        }


        /* ================================
           SUBMIT BUTTON
        ================================= */

        .submit-auth-btn {
          width: 100%;

          height: 43px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 8px;

          margin-top: 3px;

          background: linear-gradient(
            135deg,
            #515157ff,
            #38343fff
          );

          color: #FFFFFF;

          border: none;

          border-radius: 9px;

          font-size: 13px;
          font-weight: 700;

          cursor: pointer;

          box-shadow:
            0 6px 18px rgba(99, 102, 241, 0.20);

          transition:
            transform 0.15s ease,
            box-shadow 0.15s ease,
            opacity 0.15s ease;
        }

        .submit-auth-btn:hover:not(:disabled) {
          transform: translateY(-1px);

          box-shadow:
            0 8px 22px rgba(99, 102, 241, 0.30);
        }

        .submit-auth-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-auth-btn:disabled {
          opacity: 0.55;

          cursor: not-allowed;
        }


        /* ================================
           FEATURES
        ================================= */

        .auth-features-list {
          display: flex;
          flex-direction: column;

          gap: 8px;

          margin-top: 21px;

          padding-top: 17px;

          border-top: 1px solid #263247;
        }

        .feat-item {
          display: flex;
          align-items: center;

          gap: 8px;

          font-size: 11.5px;

          color: #94A3B8;
        }

        .feat-check {
          flex-shrink: 0;

          color: #34D399;
        }


        /* ================================
           BOTTOM TEXT
        ================================= */

        .auth-bottom-text {
          margin-top: 18px;

          text-align: center;

          font-size: 12px;

          color: #64748B;
        }

        .auth-bottom-text button {
          padding: 0;

          background: transparent;

          border: none;

          color: #818CF8;

          font-size: 12px;
          font-weight: 600;

          cursor: pointer;
        }

        .auth-bottom-text button:hover {
          color: #A5B4FC;

          text-decoration: underline;
        }


        /* ================================
           LOADER
        ================================= */

        .spinning {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }


        /* ================================
           MOBILE
        ================================= */

        @media (max-width: 480px) {

          .auth-overlay {
            padding: 14px;
          }

          .auth-modal {
            padding: 22px 18px;

            border-radius: 16px;
          }

          .auth-brand-text {
            font-size: 16px;
          }

          .tab-btn {
            font-size: 12px;
          }

        }

      `}</style>
    </div>
  );
};