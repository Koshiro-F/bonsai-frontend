import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import Dashboard from './Dashboard'

function App() {
  return (
      <Router basename="/">
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
