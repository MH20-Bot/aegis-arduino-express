import {
  Route,
  Routes
} from 'react-router-dom';

import Layout from './components/Layout.jsx';

import ProtectedRoute from './components/ProtectedRoute.jsx';

import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Dashboard from './pages/Dashboard.jsx';

import EmergencyContacts from './pages/EmergencyContacts.jsx';

import EmergencyResponse from './pages/EmergencyResponse.jsx';

import FeatureDetails from './pages/FeatureDetails.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';

import ProtectedFeature from './pages/ProtectedFeature.jsx';

import Register from './pages/Register.jsx';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/contact"
          element={<Contact />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/features/:slug"
          element={
            <FeatureDetails />
          }
        />

        <Route
          path="/emergency-response/:token"
          element={
            <EmergencyResponse />
          }
        />

        <Route
          element={
            <ProtectedRoute />
          }
        >
          <Route
            path="/dashboard"
            element={
              <Dashboard />
            }
          />

          <Route
            path="/dashboard/emergency-contacts"
            element={
              <EmergencyContacts />
            }
          />

          <Route
            path="/app/features/:slug"
            element={
              <ProtectedFeature />
            }
          />
        </Route>

        <Route
          path="*"
          element={<NotFound />}
        />
      </Route>
    </Routes>
  );
}

export default App;