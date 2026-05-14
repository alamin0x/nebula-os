import { useState, useCallback, memo } from 'react';
import { useInstalledAppsStore } from '../stores/installedAppsStore';
import { appCatalog } from './appCatalog';
import { validateManifest } from '../types/appManifest';
import type { AppManifest } from '../types/appManifest';

type Tab = 'catalog' | 'installed' | 'import';

const AppStore = memo(function AppStore() {
  const [activeTab, setActiveTab] = useState<Tab>('catalog');
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const apps = useInstalledAppsStore((s) => s.apps);
  const installApp = useInstalledAppsStore((s) => s.installApp);
  const uninstallApp = useInstalledAppsStore((s) => s.uninstallApp);

  const isInstalled = useCallback(
    (id: string) => apps.some((a) => a.id === id),
    [apps]
  );

  const handleInstall = useCallback(
    (manifest: AppManifest) => {
      const error = installApp(manifest);
      if (error) {
        setImportError(error);
        setTimeout(() => setImportError(null), 3000);
      }
    },
    [installApp]
  );

  const handleUninstall = useCallback(
    (id: string) => {
      uninstallApp(id);
    },
    [uninstallApp]
  );

  const handleImportJson = useCallback(() => {
    setImportError(null);
    setImportSuccess(null);

    if (!importJson.trim()) {
      setImportError('Please paste a JSON manifest.');
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(importJson);
    } catch {
      setImportError('Invalid JSON. Please check your syntax.');
      return;
    }

    const validationError = validateManifest(parsed);
    if (validationError) {
      setImportError(validationError);
      return;
    }

    const error = installApp(parsed as AppManifest);
    if (error) {
      setImportError(error);
    } else {
      setImportSuccess(`"${(parsed as AppManifest).name}" installed successfully!`);
      setImportJson('');
      setTimeout(() => setImportSuccess(null), 3000);
    }
  }, [importJson, installApp]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setImportError(null);
      setImportSuccess(null);

      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch {
          setImportError('File does not contain valid JSON.');
          return;
        }

        const validationError = validateManifest(parsed);
        if (validationError) {
          setImportError(validationError);
          return;
        }

        const error = installApp(parsed as AppManifest);
        if (error) {
          setImportError(error);
        } else {
          setImportSuccess(`"${(parsed as AppManifest).name}" installed successfully!`);
          setTimeout(() => setImportSuccess(null), 3000);
        }
      };
      reader.readAsText(file);
      // Reset input so same file can be re-uploaded
      e.target.value = '';
    },
    [installApp]
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ color: 'var(--theme-text)' }}>
      {/* Tab bar */}
      <div className="flex border-b shrink-0" style={{ borderColor: 'var(--theme-surface)' }}>
        {(['catalog', 'installed', 'import'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors duration-200 ${
              activeTab === tab ? 'border-b-2' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              borderColor: activeTab === tab ? 'var(--theme-primary)' : 'transparent',
              color: activeTab === tab ? 'var(--theme-primary)' : 'var(--theme-text)',
            }}
          >
            {tab === 'import' ? 'Custom Import' : tab}
          </button>
        ))}
      </div>

      {/* Error/Success banners */}
      {importError && (
        <div className="px-4 py-2 text-xs border-b" style={{ background: 'rgba(239,68,68,.1)', color: '#f87171', borderColor: 'rgba(239,68,68,.3)' }}>
          ⚠️ {importError}
        </div>
      )}
      {importSuccess && (
        <div className="px-4 py-2 text-xs border-b" style={{ background: 'rgba(34,197,94,.1)', color: '#4ade80', borderColor: 'rgba(34,197,94,.3)' }}>
          ✓ {importSuccess}
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'catalog' && (
          <div className="grid grid-cols-2 gap-3">
            {appCatalog.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                installed={isInstalled(app.id)}
                onInstall={() => handleInstall(app)}
                onUninstall={() => handleUninstall(app.id)}
              />
            ))}
          </div>
        )}

        {activeTab === 'installed' && (
          <div>
            {apps.length === 0 ? (
              <div className="text-center py-12 opacity-50 text-sm">
                No apps installed yet. Browse the catalog to get started.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {apps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    installed={true}
                    onInstall={() => {}}
                    onUninstall={() => handleUninstall(app.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'import' && (
          <div className="flex flex-col gap-4 max-w-lg">
            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--theme-primary)' }}>
                Paste JSON Manifest
              </h3>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                className="w-full h-40 p-3 rounded-lg text-xs font-mono resize-none outline-none"
                style={{
                  backgroundColor: 'var(--theme-surface)',
                  color: 'var(--theme-text)',
                  border: '1px solid rgba(255,255,255,.1)',
                }}
                placeholder={`{\n  "id": "my-app",\n  "name": "My App",\n  "icon": "⚡",\n  "description": "My custom app",\n  "type": "html",\n  "html": "<html>...</html>"\n}`}
              />
              <button
                onClick={handleImportJson}
                className="mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:opacity-90"
                style={{ backgroundColor: 'var(--theme-primary)', color: '#fff' }}
              >
                Install from JSON
              </button>
            </div>

            <div className="border-t pt-4" style={{ borderColor: 'var(--theme-surface)' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--theme-primary)' }}>
                Upload .nebula File
              </h3>
              <p className="text-xs opacity-60 mb-2">
                A .nebula file is a JSON manifest with the .nebula extension.
              </p>
              <label
                className="inline-block px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200 hover:opacity-90"
                style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-primary)', color: 'var(--theme-primary)' }}
              >
                Choose File
                <input
                  type="file"
                  accept=".nebula,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="border-t pt-4" style={{ borderColor: 'var(--theme-surface)' }}>
              <h3 className="text-xs font-semibold mb-1 opacity-60">Manifest Format</h3>
              <pre className="text-[10px] opacity-50 font-mono leading-relaxed">
{`{
  "id": "unique-id",
  "name": "Display Name",
  "icon": "🎯",
  "description": "Short description",
  "type": "web" | "html",
  "url": "https://...",  // for web type
  "html": "<html>...</html>"  // for html type
}`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

/** Individual app card in the catalog/installed grid */
const AppCard = memo(function AppCard({
  app,
  installed,
  onInstall,
  onUninstall,
}: {
  app: AppManifest;
  installed: boolean;
  onInstall: () => void;
  onUninstall: () => void;
}) {
  return (
    <div
      className="flex flex-col gap-2 p-3 rounded-lg transition-colors duration-200"
      style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid rgba(255,255,255,.05)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{app.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{app.name}</div>
          <div className="text-[10px] opacity-50 truncate">{app.description}</div>
        </div>
      </div>
      {installed ? (
        <button
          onClick={onUninstall}
          className="w-full py-1.5 rounded text-xs font-medium transition-colors duration-200 hover:opacity-80"
          style={{ backgroundColor: 'rgba(239,68,68,.2)', color: '#f87171', border: '1px solid rgba(239,68,68,.3)' }}
        >
          Uninstall
        </button>
      ) : (
        <button
          onClick={onInstall}
          className="w-full py-1.5 rounded text-xs font-medium transition-colors duration-200 hover:opacity-80"
          style={{ backgroundColor: 'var(--theme-primary)', color: '#fff' }}
        >
          Install
        </button>
      )}
    </div>
  );
});

export default AppStore;
