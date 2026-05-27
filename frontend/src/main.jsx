import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n'
import { registerServiceWorker } from './registerServiceWorker'

ReactDOM.createRoot(document.getElementById('root')).render(<App />)

registerServiceWorker()
