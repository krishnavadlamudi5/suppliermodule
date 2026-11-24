import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, App as AntApp } from 'antd';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import './styles/global.scss';
import { antdTheme } from './theme/antdTheme';
import { PortalProvider } from './state/PortalProvider';
import { createMockRepository } from './data/mockRepository';
import App from './App';

if (import.meta.env.DEV) import('./devtools');

// Swap for an HTTP repository when the backend is ready.
const repository = createMockRepository({ latency: 150 });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider theme={antdTheme}>
      <AntApp>
        <PortalProvider repository={repository}>
          <App />
        </PortalProvider>
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
);
