import { Plus, Download, Upload, Sun, Moon, Menu } from 'lucide-react';
import { useAgentStore, useUIStore } from '../../store';
import { exportToJson, importFromJson } from '../../utils';

export function Header() {
  const { theme, toggleSidebar, setTheme } = useUIStore();
  const { addAgent } = useAgentStore();

  const handleExport = () => {
    const agents = useAgentStore.getState().agents;
    exportToJson(agents, []);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const data = await importFromJson(file);
          // Would need to implement import logic
          console.log('Imported:', data);
        } catch (err) {
          console.error('Import failed:', err);
        }
      }
    };
    input.click();
  };

  const handleAddAgent = () => {
    addAgent({
      name: 'New Agent',
      role: 'Agent',
      description: '',
      avatar: '',
      skills: [],
      tier: 'junior',
      files: [],
    });
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Agent Org Chart</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleAddAgent}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Agent
        </button>

        <button
          onClick={handleExport}
          className="p-2 hover:bg-gray-100 rounded-lg"
          title="Export JSON"
        >
          <Download className="w-5 h-5 text-gray-600" />
        </button>

        <button
          onClick={handleImport}
          className="p-2 hover:bg-gray-100 rounded-lg"
          title="Import JSON"
        >
          <Upload className="w-5 h-5 text-gray-600" />
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-100 rounded-lg"
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-gray-600" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>
    </header>
  );
}
