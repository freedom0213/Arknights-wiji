import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import OperatorsPage from './pages/OperatorsPage'
import OperatorDetailPage from './pages/OperatorDetailPage'
import StagesPage from './pages/StagesPage'
import EnemiesPage from './pages/EnemiesPage'
import EnemyDetailPage from './pages/EnemyDetailPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/operators" element={<OperatorsPage />} />
        <Route path="/operators/:id" element={<OperatorDetailPage />} />
        <Route path="/stages" element={<StagesPage />} />
        <Route path="/enemies" element={<EnemiesPage />} />
        <Route path="/enemies/:id" element={<EnemyDetailPage />} />
      </Route>
    </Routes>
  )
}
