import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import OperatorsPage from './pages/OperatorsPage'
import OperatorDetailPage from './pages/OperatorDetailPage'
import StagesPage from './pages/StagesPage'
import EnemiesPage from './pages/EnemiesPage'
import EnemyDetailPage from './pages/EnemyDetailPage'
import MaterialsPage from './pages/MaterialsPage'
import MaterialDetailPage from './pages/MaterialDetailPage'
import SkinGalleryPage from './pages/SkinGalleryPage'
import SkinDetailPage from './pages/SkinDetailPage'
import ActivitiesPage from './pages/ActivitiesPage'
import ActivityDetailPage from './pages/ActivityDetailPage'

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
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/materials/:id" element={<MaterialDetailPage />} />
        <Route path="/skins" element={<SkinGalleryPage />} />
        <Route path="/skins/:id" element={<SkinDetailPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/activities/:id" element={<ActivityDetailPage />} />
      </Route>
    </Routes>
  )
}
