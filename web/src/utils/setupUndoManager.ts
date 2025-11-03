import { InternalEvent, type EventObject, UndoManager, type Graph } from '@maxgraph/core'

export interface UndoManagerApi {
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  destroy: () => void
}

export interface UndoManagerState {
  canUndo: boolean
  canRedo: boolean
}

type StateChangeHandler = (state: UndoManagerState) => void

/**
 * Sets up a maxGraph {@link UndoManager} for the given graph instance and wires it to the
 * graph model and view so that all undoable edits are captured automatically.
 *
 * @param graph The maxGraph instance the undo manager should observe.
 * @param onStateChange Optional callback to receive updates whenever the undo/redo enablement changes.
 */
export function setupUndoManager(graph: Graph, onStateChange?: StateChangeHandler): UndoManagerApi {
  const undoManager = new UndoManager()

  const notifyStateChange = () => {
    onStateChange?.({
      canUndo: undoManager.canUndo(),
      canRedo: undoManager.canRedo()
    })
  }

  const undoableEditListener = (_sender: unknown, evt: EventObject) => {
    const edit = evt.getProperty('edit')
    if (edit) {
      undoManager.undoableEditHappened(edit)
      notifyStateChange()
    }
  }

  const dataModel = graph.getDataModel()
  const view = graph.getView()

  dataModel.addListener(InternalEvent.UNDO, undoableEditListener)
  view.addListener(InternalEvent.UNDO, undoableEditListener)

  const undo = () => {
    if (!undoManager.canUndo()) {
      return
    }

    undoManager.undo()
    notifyStateChange()
  }

  const redo = () => {
    if (!undoManager.canRedo()) {
      return
    }

    undoManager.redo()
    notifyStateChange()
  }

  const destroy = () => {
    dataModel.removeListener(undoableEditListener)
    view.removeListener(undoableEditListener)
  }

  // Ensure initial state is reported to consumers.
  notifyStateChange()

  return {
    undo,
    redo,
    canUndo: () => undoManager.canUndo(),
    canRedo: () => undoManager.canRedo(),
    destroy
  }
}
