import React from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Container, Nav } from '@openedx/paragon';
import { MainPage } from './pages';
import History from './pages/History';
import Documents from './pages/Documents';

const Navigation = () => {
  const location = useLocation();

  return (
    <div style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
      <Container>
        <Nav variant="tabs" className="py-2">
          <Nav.Item>
            <Nav.Link
              as={NavLink}
              to="/"
              active={location.pathname === '/'}
            >
              Create Course
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              as={NavLink}
              to="/history"
              active={location.pathname === '/history'}
            >
              History
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              as={NavLink}
              to="/documents"
              active={location.pathname === '/documents'}
            >
              Documents
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Container>
    </div>
  );
};

const App = () => {
  const location = useLocation();
  const showNavigation = location.pathname !== '/';

  return (
    <>
      {showNavigation && <Navigation />}
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/history" element={<History />} />
        <Route path="/documents" element={<Documents />} />
      </Routes>
    </>
  );
};

export default App;

