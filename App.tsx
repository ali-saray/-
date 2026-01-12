import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { RequestPage } from "./pages/RequestPage";
import { HospitalRequestPage } from "./pages/HospitalRequestPage";
import { AdminPage } from "./pages/AdminPage";

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 transition-colors duration-300">
        <Navbar />
        <div className="container mx-auto">
          <Routes>
            <Route path="/" element={<RequestPage />} />
            <Route path="/hospital" element={<HospitalRequestPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;