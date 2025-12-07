import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Edit, Trash2, Plus } from 'lucide-react';
import useGroupStore from '../store/groupStore';

export default function Groups() {
  const navigate = useNavigate();
  const { groups, fetchGroups, deleteGroup } = useGroupStore();

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return (
    <div className="page-container">
      <div className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 theme-text" /> Groups
          </h1>
          <button onClick={() => navigate('/group-fixtures')} className="btn btn-primary">
            <Plus className="w-4 h-4" /> New Group
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          {groups.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Users className="w-16 h-16 text-white/10 mb-4" />
              <p className="text-white/40 mb-4">No groups created yet</p>
              <button onClick={() => navigate('/group-fixtures')} className="btn btn-primary">
                Create Your First Group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {groups.map((group) => (
                <div 
                  key={group.group_id || group.id} 
                  className="card p-3"
                  style={{ borderColor: group.color || 'var(--border-color)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ background: group.color || 'var(--theme-primary)' }}
                    />
                    <span className="font-semibold text-white text-sm truncate flex-1">{group.name}</span>
                  </div>
                  
                  <p className="text-[10px] text-white/40 mb-2">
                    {group.channels?.length || 0} channels
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/group-fixtures?edit=${group.group_id || group.id}`)}
                      className="flex-1 btn btn-sm btn-secondary"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteGroup(group.group_id || group.id)}
                      className="btn btn-sm btn-danger"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const GroupsHeaderExtension = () => null;
