import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './components/Home.tsx';
import Dashboard from './components/Dashboard.tsx';
import './index.css'; // Make sure the CSS is imported

function App() {
  return (
    <Router>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.25rem' }}>
            Slack Connect
          </h1>
          <p style={{ color: '#6b7280' }}>
            Send and schedule messages to your workspace.
          </p>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }}/>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;