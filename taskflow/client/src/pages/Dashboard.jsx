import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import toast from 'react-hot-toast'

const STATUS_STYLE = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
}

const PRIORITY_STYLE = {
  LOW: 'text-green-600',
  MEDIUM: 'text-amber-600',
  HIGH: 'text-red-600',
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function isOverdue(task) {
  return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard')
      .then((r) => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading dashboard…
      </div>
    )
  }
  if (!data) return null

  const { stats, myTasks, recentTasks } = data

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your overview across all projects</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Projects" value={stats.totalProjects} accent="text-indigo-600" />
        <StatCard label="Total Tasks" value={stats.totalTasks} accent="text-gray-900" />
        <StatCard label="To Do" value={stats.todo} accent="text-gray-700" />
        <StatCard label="In Progress" value={stats.inProgress} accent="text-blue-600" />
        <StatCard label="Done" value={stats.done} accent="text-green-600" />
        <StatCard label="Overdue" value={stats.overdue} accent={stats.overdue > 0 ? 'text-red-600' : 'text-gray-400'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">My Tasks</h3>
          {myTasks.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No tasks assigned to you yet</p>
          ) : (
            <div className="space-y-2">
              {myTasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/projects/${task.project.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {task.project.name}
                      {task.dueDate && (
                        <span className={isOverdue(task) ? ' text-red-500 font-medium' : ''}>
                          {' '}· Due {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ml-3 shrink-0 ${STATUS_STYLE[task.status]}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Tasks</h3>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No tasks yet — create a project to get started</p>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/projects/${task.project.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                      {isOverdue(task) && (
                        <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium shrink-0">OVERDUE</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {task.project.name}
                      {task.assignee && ` · ${task.assignee.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-3 shrink-0">
                    <span className={`text-xs font-semibold ${PRIORITY_STYLE[task.priority]}`}>
                      {task.priority}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLE[task.status]}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
