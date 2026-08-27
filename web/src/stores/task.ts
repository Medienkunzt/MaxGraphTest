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
    title: 'A1 – Invoice Management',
    content: `<h2>Task: Data Model for Invoice Management</h2>
<p>A company wants to record and manage invoices digitally. Analyze the business requirements and develop an appropriate conceptual data model.</p>
<h3>Requirements</h3>
<ul>
  <li>Each <strong>invoice</strong> is identified by a unique invoice number and contains an issue date and a total amount.</li>
  <li>An invoice is issued to exactly one <strong>customer</strong>. A customer may receive multiple invoices. Record the customer's name, address, and contact details.</li>
  <li>Each invoice consists of one or more <strong>invoice items</strong>. Each item references a <strong>product</strong>, specifies the ordered quantity, and records an item-specific unit price.</li>
  <li>A <strong>product</strong> has a product number, description, unit (e.g. item, kg), and current list price.</li>
  <li>The invoice total is calculated from its individual items; model the attributes required for this calculation.</li>
</ul>
<h3>Assignment</h3>
<ol>
  <li>Identify all relevant <strong>entity types</strong> and their attributes.</li>
  <li>Describe the <strong>Connections</strong> between the entity types and define their cardinalities.</li>
  <li>Create the corresponding <strong>ER diagram</strong> in the modeling environment.</li>
</ol>`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'A2 – Personnel & Salary Management',
    content: `<h2>Task: Data Model for Personnel Management</h2>
<p>A company wants to represent its personnel structure—including positions, salary grades, and department assignments—in a database. Analyze the requirements and design a conceptual data model.</p>
<h3>Requirements</h3>
<ul>
  <li>Each <strong>employee</strong> is uniquely identified by an employee number. Also record first name, last name, start date, and contact details.</li>
  <li>Each employee belongs to exactly one <strong>department</strong>. A department may employ multiple employees. Each department has a name and a responsible department manager, who is also an employee.</li>
  <li>Each employee is assigned exactly one <strong>position</strong> (e.g. “Software Developer” or “Project Manager”). Model the job title and area of responsibility.</li>
  <li><strong>Compensation</strong> is based on a <strong>salary grade</strong> assigned to the position. A salary grade defines a minimum salary, maximum salary, and name (e.g. “EG 10”).</li>
  <li>An employee's actual <strong>salary</strong> lies within the range of their salary grade and is recorded individually.</li>
</ul>
<h3>Assignment</h3>
<ol>
  <li>Identify all relevant <strong>entity types</strong> and their attributes.</li>
  <li>Describe the <strong>Connections</strong> between the entity types, including cardinalities, and account for the department manager's self-reference.</li>
  <li>Create the corresponding <strong>ER diagram</strong> in the modeling environment.</li>
</ol>`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'A3 – Order Management',
    content: `<h2>Task: UML Class Diagram for Order Management</h2>
<p>A <span style="color: rgb(30, 136, 229);"><strong>Customer</strong></span> with a <span style="color: rgb(67, 160, 71);"><em>customerNumber</em></span> places <span style="color: rgb(30, 136, 229);"><strong>Orders</strong></span>, each identified by an <span style="color: rgb(67, 160, 71);"><em>orderNumber</em></span>. An <span style="color: rgb(30, 136, 229);"><strong>Order</strong></span> consists of at least one <span style="color: rgb(30, 136, 229);"><strong>Order Item</strong></span> with a <span style="color: rgb(67, 160, 71);"><em>quantity</em></span>.<br>
Each <span style="color: rgb(30, 136, 229);"><strong>Order Item</strong></span> refers to exactly one <span style="color: rgb(30, 136, 229);"><strong>Product</strong></span>, identified by a <span style="color: rgb(67, 160, 71);"><em>productNumber</em></span>. <span style="color: rgb(30, 136, 229);"><strong>Products</strong></span> implement the <span style="color: rgb(251, 140, 0);"><strong>Sellable</strong></span> interface.</p>`,
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
      title: title ?? `Task ${tasks.value.length + 1}`,
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
