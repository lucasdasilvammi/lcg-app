import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ColdStartLoader from './components/ColdStartLoader.jsx'

function AppLoader() {
  const [serverReady, setServerReady] = useState(false);

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch('/api/status');
        if (response.ok) {
          setServerReady(true);
        }
      } catch (error) {
        // Server not ready yet, will retry on next mount
        setTimeout(checkServer, 2000);
      }
    };

    checkServer();
  }, []);

  if (!serverReady) {
    return <ColdStartLoader />;
  }

  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppLoader />
  </StrictMode>,
)
