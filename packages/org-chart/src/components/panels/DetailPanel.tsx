import { useState } from 'react';
import { X, Trash2, Save } from 'lucide-react';
import { useAgentStore, useUIStore } from '../../store';
import type { Agent } from '../../types';

export function DetailPanel() {
  const { agents, selectedAgentId, updateAgent, deleteAgent } = useAgentStore();
  const { isDetailPanelOpen, setDetailPanelOpen } = useUIStore();
  
  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Agent>>({});

  if (!isDetailPanelOpen || !selectedAgent) return null;

  const handleEdit = () => {
    setEditForm(selectedAgent);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (selectedAgentId) {
      updateAgent(selectedAgentId, editForm);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (selectedAgentId && confirm('Delete this agent?')) {
      deleteAgent(selectedAgentId);
      setDetailPanelOpen(false);
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Agent Details</h2>
        <button
          onClick={() => setDetailPanelOpen(false)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input
                type="text"
                value={editForm.role || ''}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <select
                value={editForm.tier || 'junior'}
                onChange={(e) => setEditForm({ ...editForm, tier: e.target.value as Agent['tier'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="oversight">Oversight</option>
                <option value="senior">Senior</option>
                <option value="junior">Junior</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium text-gray-600">
                {selectedAgent.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedAgent.name}</h3>
                <p className="text-sm text-gray-500">{selectedAgent.role}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
              <p className="text-sm text-gray-600">{selectedAgent.description || 'No description'}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Tier</h4>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {selectedAgent.tier}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Skills</h4>
              <div className="flex flex-wrap gap-1">
                {selectedAgent.skills.length > 0 ? (
                  selectedAgent.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No skills</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleEdit}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 border border-red-200 rounded-md hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
