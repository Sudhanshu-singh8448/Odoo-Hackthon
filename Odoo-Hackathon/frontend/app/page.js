'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="landing-container">
      <style jsx>{`
        .landing-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: radial-gradient(circle at top, var(--primary-50), var(--bg-primary) 80%);
          font-family: var(--font-sans);
          overflow-x: hidden;
        }

        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-4) var(--space-8);
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
        }

        .brand-logo {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--primary-700);
          display: flex;
          align-items: center;
          gap: var(--space-2);
          text-decoration: none;
        }

        .brand-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
          color: white;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .nav-actions {
          display: flex;
          gap: var(--space-4);
        }

        .btn-login {
          padding: 10px 24px;
          border-radius: var(--radius-full);
          font-weight: 600;
          text-decoration: none;
          color: var(--primary-700);
          background: transparent;
          border: 2px solid var(--primary-200);
          transition: var(--transition-base);
        }

        .btn-login:hover {
          background: var(--primary-50);
          border-color: var(--primary-300);
        }

        .btn-register {
          padding: 10px 24px;
          border-radius: var(--radius-full);
          font-weight: 600;
          text-decoration: none;
          color: white;
          background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
          box-shadow: var(--shadow-md);
          transition: var(--transition-base);
        }

        .btn-register:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg), var(--shadow-glow);
        }

        .hero {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: var(--space-16) var(--space-6);
          position: relative;
        }

        .hero-badge {
          background: var(--primary-100);
          color: var(--primary-700);
          padding: 6px 16px;
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: var(--space-6);
          display: inline-block;
          animation: fade-in-up 0.8s ease;
        }

        .hero-title {
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          font-weight: 900;
          color: var(--gray-900);
          line-height: 1.1;
          margin-bottom: var(--space-6);
          max-width: 800px;
          animation: fade-in-up 1s ease;
        }

        .hero-title span {
          background: linear-gradient(135deg, var(--primary-500), #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: clamp(1.1rem, 2vw, 1.25rem);
          color: var(--gray-600);
          max-width: 600px;
          line-height: 1.6;
          margin-bottom: var(--space-10);
          animation: fade-in-up 1.2s ease;
        }

        .hero-actions {
          display: flex;
          gap: var(--space-4);
          animation: fade-in-up 1.4s ease;
        }

        .hero-actions .btn-login {
          background: white;
          font-size: 1.1rem;
          padding: 14px 32px;
        }

        .hero-actions .btn-register {
          font-size: 1.1rem;
          padding: 14px 32px;
        }

        .features-section {
          padding: var(--space-16) var(--space-6);
          background: white;
          position: relative;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--space-8);
          max-width: 1200px;
          margin: 0 auto;
        }

        .feature-card {
          background: var(--bg-primary);
          padding: var(--space-8);
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-light);
          transition: var(--transition-base);
          text-align: left;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary-200);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          background: var(--primary-100);
          color: var(--primary-600);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-bottom: var(--space-4);
        }

        .feature-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: var(--space-2);
        }

        .feature-desc {
          color: var(--gray-600);
          line-height: 1.6;
        }

        .decorative-blob {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, var(--primary-200) 0%, transparent 70%);
          opacity: 0.3;
          z-index: 0;
          pointer-events: none;
          top: -100px;
          left: -200px;
        }

        .decorative-blob-2 {
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
          opacity: 0.15;
          z-index: 0;
          pointer-events: none;
          bottom: 100px;
          right: -100px;
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .nav-actions { display: none; }
          .hero-actions { flex-direction: column; width: 100%; max-width: 300px; }
          .hero-actions .btn-login, .hero-actions .btn-register { width: 100%; }
        }
      `}</style>

      {/* Decorative Background Elements */}
      <div className="decorative-blob" />
      <div className="decorative-blob-2" />

      {/* Navigation */}
      <nav className="navbar">
        <Link href="/" className="brand-logo">
          <div className="brand-icon">VB</div>
          VendorBridge
        </Link>
        <div className="nav-actions">
          <Link href="/login" className="btn-login">Login</Link>
          <Link href="/register" className="btn-register">Register</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-badge">🚀 Next-Gen ERP Platform</div>
        <h1 className="hero-title">
          Simplify & Digitize Your <br />
          <span>Procurement Operations</span>
        </h1>
        <p className="hero-subtitle">
          VendorBridge is a centralized ERP platform that manages vendors, RFQs,
          quotations, approvals, purchase orders, and invoice generation in real-time.
        </p>
        <div className="hero-actions">
          <Link href="/login" className="btn-login">Login to Portal</Link>
          <Link href="/register" className="btn-register">Create Account</Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <h3 className="feature-title">Centralized Vendor Communication</h3>
            <p className="feature-desc">
              Manage all vendor relationships in one place. Streamline RFQs, receive quotations directly, and compare vendor pricing side-by-side.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3 className="feature-title">Structured Workflows</h3>
            <p className="feature-desc">
              Reduce manual inefficiencies with automated approval workflows, role-based access control, and dynamic state transitions.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3 className="feature-title">Real-Time Tracking</h3>
            <p className="feature-desc">
              Monitor procurement activities as they happen. Auto-generate Purchase Orders and track invoice generation and payments seamlessly.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
