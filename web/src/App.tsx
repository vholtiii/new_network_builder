import type { ChangeEventHandler } from 'react'
import { useEffect, useRef, useState } from 'react'
import { AiAssistPanel } from './components/AiAssistPanel'
import { BuilderSidebar } from './components/BuilderSidebar'
import { DataWorkspace } from './components/DataWorkspace'
import { DisclaimerBanner } from './components/DisclaimerBanner'
import { FeasibilityPanel } from './components/FeasibilityPanel'
import { GuidedWizardBar } from './components/GuidedWizardBar'
import { GlossaryDrawer } from './components/GlossaryDrawer'
import { NetworkCanvas } from './components/NetworkCanvas'
import { PresentationToolbar } from './components/PresentationToolbar'
import { ResultsPanel } from './components/ResultsPanel'
import { workspaceTabLabels } from './content/navLabels'
import { useProjectStore, type WorkspaceTab } from './store/projectStore'
import { downloadText } from './utils/download'
import './AppShell.css'

const tabs: WorkspaceTab[] = ['builder', 'data', 'results', 'present']

export default function App() {
  const diagramRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const [glossaryOpen, setGlossaryOpen] = useState(false)

  const tab = useProjectStore((s) => s.tab)
  const setTab = useProjectStore((s) => s.setTab)
  const project = useProjectStore((s) => s.project)
  const exportProjectJson = useProjectStore((s) => s.exportProjectJson)
  const importFromJsonText = useProjectStore((s) => s.importFromJsonText)
  const selectLayer = useProjectStore((s) => s.selectLayer)
  const activeFlowStep = useProjectStore((s) => s.activeFlowStep)
  const selectedLayerId = useProjectStore((s) => s.selectedLayerId)
  const updateNetworkMeta = useProjectStore((s) => s.updateNetworkMeta)
  const beginnerMode = useProjectStore((s) => s.beginnerMode)
  const setBeginnerMode = useProjectStore((s) => s.setBeginnerMode)
  const presentationMode = useProjectStore((s) => s.presentationMode)
  const setPresentationMode = useProjectStore((s) => s.setPresentationMode)
  const guidedWizardEnabled = useProjectStore((s) => s.guidedWizardEnabled)
  const setGuidedWizardEnabled = useProjectStore((s) => s.setGuidedWizardEnabled)

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

  const shellClass = ['app-shell', beginnerMode ? 'beginner-mode' : '', presentationMode ? 'presentation-mode' : '']
    .filter(Boolean)
    .join(' ')

  const skipToMain = () => {
    mainRef.current?.focus()
  }

  return (
    <div className={shellClass}>
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault()
          skipToMain()
        }}
      >
        Skip to main content
      </a>
      <DisclaimerBanner />
      <GuidedWizardBar />
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
          {tabs.map((key) => (
            <button
              key={key}
              type="button"
              className={tab === key ? 'tab active' : 'tab'}
              aria-current={tab === key ? 'page' : undefined}
              disabled={guidedWizardEnabled}
              title={guidedWizardEnabled ? 'Turn off Guided presentation steps to switch tabs freely' : undefined}
              onClick={() => setTab(key)}
            >
              {workspaceTabLabels[key]}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <div className="header-toggles" role="group" aria-label="View options">
            <button
              type="button"
              className="toggle-btn"
              aria-pressed={guidedWizardEnabled}
              onClick={() => setGuidedWizardEnabled(!guidedWizardEnabled)}
            >
              Guided presentation steps
            </button>
            <button
              type="button"
              className="toggle-btn"
              aria-pressed={beginnerMode}
              onClick={() => setBeginnerMode(!beginnerMode)}
            >
              Beginner explanations
            </button>
            <button
              type="button"
              className="toggle-btn"
              aria-pressed={presentationMode}
              onClick={() => setPresentationMode(!presentationMode)}
            >
              Presentation layout
            </button>
            <button type="button" className="toggle-btn" onClick={() => setGlossaryOpen(true)}>
              Open glossary
            </button>
          </div>
          <button type="button" onClick={() => downloadText('biobank-nn-project.json', exportProjectJson())}>
            Export JSON project
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            Import JSON project
          </button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={handleImport} />
        </div>
      </header>

      <main ref={mainRef} id="main-content" className="app-main" tabIndex={-1}>
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
        <section className="diagram-pane" aria-label="Network diagram">
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
      <GlossaryDrawer open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
    </div>
  )
}
