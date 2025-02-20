import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Topbar from './components/Topbar';
import Reports from './components/Reports';
import Reupload from './components/Reupload';
import ReportForm from './components/ReportForm'; 
import LoanDetailsReport from './components/LoanDetailsReport';
import Lucreport from './components/LUCReport'

const App = () => {
  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        
        {/* Fixed Sidebar */}
        <div style={{
          position: 'fixed', 
          top: 0, 
          left: 0, 
          bottom: 0, 
          width: '160px', 
          backgroundColor: '#fff', 
          zIndex: 100
        }}>
          <Navbar />
        </div>
        
        {/* Main Content Section */}
        <div style={{
          marginLeft: '220px', 
          paddingTop: '60px', 
          flexGrow: 1
        }}>
          
          {/* Fixed Topbar */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: '220px',
            right: 0,
            backgroundColor: '#fff',
            zIndex: 101,
            width: 'calc(100% - 260px)', 
            height: '60px'
          }}>
            <Topbar />
          </div>

          {/* Page Content */}
          <div style={{ marginTop: '-40px', padding: '20px' }}>
            <Routes>
              <Route path="/components/ReportForm" element={<ReportForm />} />
              <Route path="/components/Reports" element={<Reports />} />
              <Route path="/components/Reupload" element={<Reupload />} />
              <Route path="/components/LoanDetailsReport" element={<LoanDetailsReport />} />
              <Route path="/components/LUCReport" element={<Lucreport />} /> 

            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;

