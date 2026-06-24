import { Outlet } from 'react-router-dom';

import Footer from './Footer.jsx';
import Header from './Header.jsx';

function Layout() {
  return (
    <div className="website-shell">
      <Header />

      <main className="website-main">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default Layout;