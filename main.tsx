import { createRoot } from 'react-dom/client'
// Initialize monitoring as early as possible
import './sentry.client'
import App from './App.tsx'
import './index.css'
// Leaflet styles (for MapPicker)
import 'leaflet/dist/leaflet.css'
// Optional: collect basic Web Vitals in development
import './vitals'

createRoot(document.getElementById("root")!).render(<App />);
