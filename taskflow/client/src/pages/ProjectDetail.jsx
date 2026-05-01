import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import toast from 'react-hot-toast'
import TaskModal from '../components/TaskModal'
import MemberModal from '../components/MemberModal'

const STATUS_STYLE = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
}
const PRIORITY_STYLE = {
  LOW: 'text-green-600 bg-green-50',
  MEDIUM: 'text-amber-700 bg-amber-50',
  HIGH: 'text-red-600 bg-red-50',
}
const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'DONE']

function isOverdue(task) {
  return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
}

export default function ProjectDetail() {
  const { projectId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  const fetchProject = () => {
    setLoading(true)
    api.get(`/projects/${projectId}`)
      .then((r) => setProject(r.data))
      .catch((err) => {
        if (err.response?.status === 403) navigate('/projects')
        else toast.error('Failed to load project')
      })
      .finally(() => setLoading(false))
  }

  useEffect(fetchProject, [projectId])

  const isAdmin = project?.currentUserRole === 'ADMIN'

  const handleCreateTask = async (data) => {
    const res = await api.post(`/projects/${projectId}/tasks`, data)
    setProject((p) => ({ ...p, tasks: [res.data, ...p.tasks] }))
    toast.success('Task created!')
  }

  const handleUpdateTask = async (taskId, data) => {
    const res = await api.put(`/projects/${projectId}/tasks/${taskId}`, data)
    setProject((p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === taskId ? res.data : t)) }))
    toast.success('Task updated!')
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return
    try {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`)
      setProject((p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }))
      toast.success('Task deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task')
    }
  }

  const handleStatusChange = async (taskId, status) => {
    try {
      const res = await api.put(`/projects/${projectId}/tasks/${taskId}`, { status })
      setProject((p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === taskId ? res.data : t)) }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  const handleAddMember = async (email, role) => {
    const res = await api.post(`/projects/${projectId}/members`, { email, role })
    setProject((p) => ({ ...p, members: [...p.members, res.data] }))
    toast.success('Member added!')
  }

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member from the project?')) return
    try {
      await api.delete(`/projects/${projectId}/members/${memberId}`)
      setProject((p) => ({ ...p, members: p.members.filter((m) => m.userId !== memberId) }))
      toast.success('Member removed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member')
    }
  }

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this entire project? This cannot be undone.')) return
    try {
      await api.delete(`/projects/${projectId}`)
      toast.success('Project deleted')
      navigate('/projects')
    } catch {
      toast.error('Failed to delete project')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>
  }
  if (!project) return null

  const filteredTasks = filterStatus === 'ALL'
    ? project.tasks
    : project.tasks.filter((t) => t.status === filterStatus)

  const taskCounts = {
    ALL: project.tasks.length,
    TODO: project.tasks.filter((t) => t.status === 'TODO').length,
    IN_PROGRESS: project.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    DONE: project.tasks.filter((t) => t.status === 'DONE').length,
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/projects')}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Projects
            </button>
            <span className="text-gray-300">/</span>
            <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
          </div>
          {project.description && (
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <button
              onClick={() => setShowMemberModal(true)}
              className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Manage Members
            </button>
          )}
          <button
            onClick={() => { setEditingTask(null); setShowTaskModal(true) }}
            className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Add Task
          </button>
          {isAdmin && (
            <button
              onClick={handleDeleteProject}
              className="border border-red-200 text-red-500 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Team</h3>
        <div className="flex flex-wrap gap-2">
          {project.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5"
            >
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700">
                {member.user.name[0].toUpperCase()}
              </div>
              <span className="text-sm text-gray-800">{member.user.name}</span>
              <span
                className={`text-xs font-medium ${
                  member.role === 'ADMIN' ? 'text-indigo-600' : 'text-gray-400'
                }`}
              >
                {member.role}
              </span>
              {isAdmin && member.userId !== user?.id && (
                <button
                  onClick={() => handleRemoveMember(member.userId)}
                  className="text-gray-300 hover:text-red-500 text-sm leading-none ml-0.5 transition-colors"
                  title="Remove member"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-semibold text-gray-900">Tasks</h3>
          <div className="ml-auto flex items-center gap-1">
            {['ALL', ...STATUS_OPTIONS].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterStatus === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s.replace('_', ' ')}
                <span className="ml-1 opacity-60">{taskCounts[s]}</span>
              </button>
            ))}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-400 text-sm">No tasks here yet</p>
            {filterStatus === 'ALL' && (
              <button
                onClick={() => setShowTaskModal(true)}
                className="mt-2 text-sm text-indigo-600 font-medium hover:underline"
              >
                Add the first task →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">{task.title}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${PRIORITY_STYLE[task.priority]}`}>
                        {task.priority}
                      </span>
                      {isOverdue(task) && (
                        <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-400">
                      {task.assignee && (
                        <span className="flex items-center gap-1">
                          <span>👤</span> {task.assignee.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={isOverdue(task) ? 'text-red-500' : ''}>
                          📅 {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      <span>Created by {task.creator.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className={`text-xs px-2 py-1.5 rounded-lg font-medium cursor-pointer border-0 outline-none ${STATUS_STYLE[task.status]}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => { setEditingTask(task); setShowTaskModal(true) }}
                      className="text-gray-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 transition-colors text-sm"
                      title="Edit task"
                    >
                      ✎
                    </button>
                    {(isAdmin || task.creatorId === user?.id) && (
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors text-sm"
                        title="Delete task"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          members={project.members}
          onClose={() => { setShowTaskModal(false); setEditingTask(null) }}
          onSave={editingTask
            ? (data) => handleUpdateTask(editingTask.id, data)
            : handleCreateTask
          }
        />
      )}

      {showMemberModal && (
        <MemberModal
          onClose={() => setShowMemberModal(false)}
          onAdd={handleAddMember}
        />
      )}
    </div>
  )
}
