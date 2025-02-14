import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import TopBar from './components/Topbar';
import ReportForm from './components/ReportForm';
import SpecificReportPage from './components/Specificpage';

function App() {
  return (
    <Router>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Fixed Top Section */}
        <TopBar />

        <div style={{ display: 'flex', flex: 1 }}>
          {/* Sidebar */}
          <div style={{ flexShrink: 0, width: '260px' }}>
            <Navbar />
          </div>

          {/* Main Content */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#f9f9f9',
              boxShadow: 'inset 0 0 25px rgba(0, 0, 0, 0.6)',
              overflowY: 'auto',
              height: 'calc(100vh - 50px)',
              padding: '20px', // Added padding for better spacing
            }}
          >
            <Routes>
              <Route path="/" element={<ReportForm />} />
              <Route path="/reports/:reportType" element={<SpecificReportPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
