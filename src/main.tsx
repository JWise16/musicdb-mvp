import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import './index.css'
import App from './App.tsx'
import { clarityService } from './services/clarityService'
import { debugClarity } from './utils/clarityDebug'

// Initialize Clarity analytics
clarityService.initialize();

// Debug Clarity in development
if (import.meta.env.DEV) {
  setTimeout(debugClarity, 3000);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
