import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DiagramTask } from '@/model/Task'

let sequenceCounter = 0

const generateTaskId = (): string => {
  sequenceCounter += 1
  return `task-${sequenceCounter}`
}

const now = () => new Date().toISOString()

const DEFAULT_HIGHLIGHT_COLORS = ['#FFF176', '#C8E6C9', '#BBDEFB', '#F8BBD0', '#FFE0B2', '#E1BEE7']

const EXAMPLE_TASKS: Omit<DiagramTask, 'id'>[] = [
  {
    title: 'A1 – Rechnungsverwaltung',
    content: `<h2>Aufgabe: Datenmodell für eine Rechnungsverwaltung</h2>
<p>In einem Unternehmen sollen Rechnungen digital erfasst und verwaltet werden. Analysieren Sie die fachlichen Anforderungen und entwickeln Sie ein geeignetes konzeptionelles Datenmodell.</p>
<h3>Anforderungen</h3>
<ul>
  <li>Jede <strong>Rechnung</strong> wird durch eine eindeutige Rechnungsnummer identifiziert und enthält ein Ausstellungsdatum sowie einen Gesamtbetrag.</li>
  <li>Eine Rechnung wird an genau einen <strong>Kunden</strong> gestellt. Ein Kunde kann mehrere Rechnungen erhalten haben. Erfassen Sie Name, Adresse und Kontaktdaten des Kunden.</li>
  <li>Jede Rechnung besteht aus einer oder mehreren <strong>Rechnungspositionen</strong>. Jede Position referenziert einen <strong>Artikel</strong>, gibt die bestellte Menge an und weist einen positionsspezifischen Einzelpreis aus.</li>
  <li>Ein <strong>Artikel</strong> besitzt eine Artikelnummer, eine Bezeichnung, eine Einheit (z.&nbsp;B. Stück, kg) sowie einen aktuellen Listenpreis.</li>
  <li>Der Gesamtbetrag einer Rechnung ergibt sich rechnerisch aus den Einzelpositionen; modellieren Sie die dafür notwendigen Attribute.</li>
</ul>
<h3>Aufgabenstellung</h3>
<ol>
  <li>Identifizieren Sie alle relevanten <strong>Entitätstypen</strong> und deren Attribute.</li>
  <li>Beschreiben Sie die <strong>Beziehungen</strong> zwischen den Entitätstypen und legen Sie jeweils die Kardinalitäten fest.</li>
  <li>Erstellen Sie das zugehörige <strong>ER-Diagramm</strong> in der Modellierungsumgebung.</li>
</ol>`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'A2 – Personalverwaltung & Gehalt',
    content: `<h2>Aufgabe: Datenmodell für eine Personalverwaltung</h2>
<p>Ein Unternehmen möchte seine Personalstruktur – einschließlich Stellen, Gehaltsgruppen und Abteilungszugehörigkeiten – in einer Datenbank abbilden. Analysieren Sie die Anforderungen und entwerfen Sie ein konzeptionelles Datenmodell.</p>
<h3>Anforderungen</h3>
<ul>
  <li>Jeder <strong>Mitarbeiter</strong> wird durch eine Personalnummer eindeutig identifiziert. Erfassen Sie außerdem Vorname, Nachname, Eintrittsdatum und Kontaktdaten.</li>
  <li>Jeder Mitarbeiter ist genau einer <strong>Abteilung</strong> zugeordnet. Eine Abteilung kann mehrere Mitarbeiter beschäftigen. Jede Abteilung hat eine Bezeichnung und einen verantwortlichen Abteilungsleiter (ebenfalls ein Mitarbeiter).</li>
  <li>Jedem Mitarbeiter ist genau eine <strong>Stelle</strong> (z.&nbsp;B. „Softwareentwickler", „Projektmanager") zugeordnet. Modellieren Sie Stellenbezeichnung und Verantwortungsbereich.</li>
  <li>Die <strong>Vergütung</strong> richtet sich nach einer <strong>Gehaltsgruppe</strong>, die der Stelle zugeordnet ist. Eine Gehaltsgruppe definiert ein Mindest- und ein Maximalgehalt sowie eine Bezeichnung (z.&nbsp;B. „EG 10").</li>
  <li>Das tatsächliche <strong>Gehalt</strong> eines Mitarbeiters liegt innerhalb der Spanne seiner Gehaltsgruppe und wird individuell festgehalten.</li>
</ul>
<h3>Aufgabenstellung</h3>
<ol>
  <li>Identifizieren Sie alle relevanten <strong>Entitätstypen</strong> und deren Attribute.</li>
  <li>Beschreiben Sie die <strong>Beziehungen</strong> zwischen den Entitätstypen inklusive Kardinalitäten; beachten Sie dabei die Selbstreferenz beim Abteilungsleiter.</li>
  <li>Erstellen Sie das zugehörige <strong>ER-Diagramm</strong> in der Modellierungsumgebung.</li>
</ol>`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export const useTaskStore = defineStore('task', () => {
  const initialTasks: DiagramTask[] = EXAMPLE_TASKS.map((t) => {
    sequenceCounter += 1
    return { ...t, id: `task-${sequenceCounter}` }
  })

  const tasks = ref<DiagramTask[]>(initialTasks)
  const currentTaskId = ref<string | null>(initialTasks[0]?.id ?? null)

  const currentTask = (): DiagramTask | null => tasks.value.find((t) => t.id === currentTaskId.value) ?? null

  const createTask = (title?: string): DiagramTask => {
    const task: DiagramTask = {
      id: generateTaskId(),
      title: title ?? `Aufgabe ${tasks.value.length + 1}`,
      content: '',
      createdAt: now(),
      updatedAt: now()
    }
    tasks.value.push(task)
    currentTaskId.value = task.id
    return task
  }

  const updateTask = (id: string, patch: Partial<Pick<DiagramTask, 'title' | 'content'>>) => {
    const index = tasks.value.findIndex((t) => t.id === id)
    if (index === -1) return
    tasks.value[index] = { ...tasks.value[index], ...patch, updatedAt: now() }
  }

  const updateTaskCanvasMarkup = (id: string, content: string, highlightColors: string[] = DEFAULT_HIGHLIGHT_COLORS) => {
    const index = tasks.value.findIndex((t) => t.id === id)
    if (index === -1) return

    const currentTask = tasks.value[index]
    tasks.value[index] = {
      ...currentTask,
      canvasMarkup: {
        content,
        highlightColors,
        updatedAt: now()
      },
      updatedAt: now()
    }
  }

  const removeTask = (id: string) => {
    tasks.value = tasks.value.filter((t) => t.id !== id)
    if (currentTaskId.value === id) {
      currentTaskId.value = tasks.value.length > 0 ? tasks.value[tasks.value.length - 1].id : null
    }
  }

  const selectTask = (id: string) => {
    currentTaskId.value = id
  }

  return { tasks, currentTaskId, currentTask, createTask, updateTask, updateTaskCanvasMarkup, removeTask, selectTask }
})
