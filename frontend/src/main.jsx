import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n'
import { initializeThemeMode } from './utils/themeMode'

initializeThemeMode()

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
