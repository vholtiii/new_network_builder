import type { ChangeEventHandler } from 'react'
import { useEffect, useRef } from 'react'
import { AiAssistPanel } from './components/AiAssistPanel'
import { BuilderSidebar } from './components/BuilderSidebar'
import { DataWorkspace } from './components/DataWorkspace'
import { DisclaimerBanner } from './components/DisclaimerBanner'
import { FeasibilityPanel } from './components/FeasibilityPanel'
import { NetworkCanvas } from './components/NetworkCanvas'
import { PresentationToolbar } from './components/PresentationToolbar'
import { ResultsPanel } from './components/ResultsPanel'
import { useProjectStore } from './store/projectStore'
import { downloadText } from './utils/download'
import './AppShell.css'

export default function App() {
  const diagramRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tab = useProjectStore((s) => s.tab)
  const setTab = useProjectStore((s) => s.setTab)
  const project = useProjectStore((s) => s.project)
  const exportProjectJson = useProjectStore((s) => s.exportProjectJson)
  const importFromJsonText = useProjectStore((s) => s.importFromJsonText)
  const selectLayer = useProjectStore((s) => s.selectLayer)
  const activeFlowStep = useProjectStore((s) => s.activeFlowStep)
  const selectedLayerId = useProjectStore((s) => s.selectedLayerId)
  const updateNetworkMeta = useProjectStore((s) => s.updateNetworkMeta)

  useEffect(() => {
    const root = document.documentElement
    const tokens = project.themeTokens
    root.style.setProperty('--bb-primary', tokens.primary)
    root.style.setProperty('--bb-secondary', tokens.secondary)
    root.style.setProperty('--bb-accent', tokens.accent)
    root.style.setProperty('--bb-background', tokens.background)
    root.style.setProperty('--bb-foreground', tokens.foreground)
    root.style.backgroundColor = tokens.background
    root.style.color = tokens.foreground
  }, [project.themeTokens])

  const handleImport: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    importFromJsonText(text)
    event.target.value = ''
  }

  return (
    <div className="app-shell">
      <DisclaimerBanner />
      <header className="app-header">
        <div>
          <p className="eyebrow">BioBank Neural Network Builder</p>
          <label className="title-field">
            Architecture title
            <input
              type="text"
              value={project.network.metadata?.name ?? ''}
              onChange={(e) => updateNetworkMeta({ name: e.target.value })}
            />
          </label>
        </div>
        <nav className="tab-nav" aria-label="Workspace sections">
          {(['builder', 'data', 'results', 'present'] as const).map((key) => (
            <button key={key} type="button" className={tab === key ? 'tab active' : 'tab'} onClick={() => setTab(key)}>
              {key === 'builder' && 'Model builder'}
              {key === 'data' && 'Synthetic data'}
              {key === 'results' && 'Mock outcomes'}
              {key === 'present' && 'Presentation'}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button type="button" onClick={() => downloadText('biobank-nn-project.json', exportProjectJson())}>
            Export JSON project
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            Import JSON project
          </button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={handleImport} />
        </div>
      </header>

      <main className="app-main">
        <aside className={`drawer ${tab === 'present' ? 'collapsed' : ''}`}>
          {tab === 'builder' && (
            <>
              <BuilderSidebar />
              <FeasibilityPanel />
            </>
          )}
          {tab === 'data' && (
            <>
              <DataWorkspace />
              <AiAssistPanel />
            </>
          )}
          {tab === 'results' && <ResultsPanel />}
          {tab === 'present' && <PresentationToolbar diagramRef={diagramRef} />}
        </aside>
        <section className="diagram-pane">
          <NetworkCanvas
            diagramRef={diagramRef}
            layers={project.network.layers}
            datasetSchema={project.datasetSchema}
            activeStep={activeFlowStep}
            selectedLayerId={selectedLayerId}
            onSelectLayer={selectLayer}
          />
        </section>
      </main>
    </div>
  )
}
