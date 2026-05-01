import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import toast from 'react-hot-toast'
import ProjectModal from '../components/ProjectModal'

export default function Projects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    api.get('/projects')
      .then((r) => setProjects(r.data))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async (data) => {
    const res = await api.post('/projects', data)
    setProjects((p) => [res.data, ...p])
    toast.success('Project created!')
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Projects</h2>
          <p className="text-sm text-gray-500 mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">📁</p>
          <p className="text-gray-600 font-medium">No projects yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Create a project and invite your team</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-indigo-600 font-medium hover:underline"
          >
            Create your first project →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => {
            const myRole = project.members.find((m) => m.userId === user?.id)?.role
            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 leading-snug">{project.name}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      myRole === 'ADMIN'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {myRole}
                  </span>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{project.description}</p>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span>👥 {project.members.length} member{project.members.length !== 1 ? 's' : ''}</span>
                  <span>📋 {project._count.tasks} task{project._count.tasks !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </Link>
            )
          })}
        </div>
      )}

      {showModal && (
        <ProjectModal onClose={() => setShowModal(false)} onSave={handleCreate} />
      )}
    </div>
  )
}
