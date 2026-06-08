import Sidebar from '../Sidebar/index.jsx';
import './index.css';

function Layout({ children }) {
  return (
    <div className="layout-root">
      <Sidebar />
      <main className="layout-main">
        {children}
      </main>
    </div>
  );
}

export default Layout;