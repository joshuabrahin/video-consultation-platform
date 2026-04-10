import { Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { HeroSection } from './components/HeroSection'
import { FeaturesSection } from './components/FeaturesSection'
import { UpcomingConsultations } from './components/UpcomingConsultations'
import { Footer } from './components/Footer'
import { BookingPage } from './pages/BookingPage'
import { ChatBubble, ChatPanel } from './components/chat'
import './index.css'

function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <UpcomingConsultations />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/book" element={<BookingPage />} />
      </Routes>

      {/* AI chat — floats above all pages */}
      <ChatBubble />
      <ChatPanel />
    </>
  )
}

export default App
