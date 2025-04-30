import {ref} from 'vue'
import {defineStore} from 'pinia'
import {InternalEvent, RubberBandHandler, EditorToolbar, Editor} from '@maxgraph/core';

export const useEditorStore = defineStore('editor', () => {

        const editor = ref<Editor>()
        const toolbarItems = ref<HTMLDivElement[]>([])

        function createEditor(container: HTMLDivElement) {
            InternalEvent.disableContextMenu(container)
            editor.value = new Editor(container)
        }

        function initEditor() {

            if (editor.value == null) {
                return
            }

            console.log("initializeGraph")

            const graph = editor.value.graph
            // Disable the built-in context menu
            // InternalEvent.disableContextMenu(container);
            graph.setConnectable(true)
            graph.setCellsEditable(false)
            // graph.value.convertValueToString = (cell) => {
            //     return this.R.prop('title', cell)
            // }
            graph.setPanning(true); // Use mouse right button for panning
            // WARN: as the maxGraph css files are not available in the npm package (at least for now), dedicated CSS class must be defined in style.css
            new RubberBandHandler(graph); // Enables rubber band selection
            // graph.addListener(DoubleClick, (graph, evt) => {
            //     const cell = this.R.pathOr([], ['properties', 'cell'], evt)
            //     console.info(cell)
            // })
        }

        function addToolbarItem(item: HTMLDivElement) {
            toolbarItems.value.push(item)
        }

        function initToolbar() {
            // const domArray = this.$refs.toolItem

            // if (!(toolbarItems.value instanceof Array) || toolbarItems.value.length <= 0) {
            //     return
            // }
            // toolbarItems.value.forEach((dom, domIndex) => {
            //     console.log("domIndex=", domIndex)
            //     // const toolItem = this.toolbarItems[domIndex]
            //     // const {width, height} = toolItem
            //     //
            //     const dropHandler = (editor, evt, cell, x, y) => {
            //         $console.log("x,y=",x,y)
            //         // this.addCell(toolItem, x, y)
            //     }
            //     const createDragPreview = () => {
            //         const elt = document.createElement('div')
            //
            //         elt.style.border = '2px dotted black'
            //         elt.style.width = `${50}px`
            //         elt.style.height = `${50}px`
            //         return elt
            //     }
            //
            //     // EditorToolbar.makeDraggable(dom, this.graph, dropHandler, createDragPreview(), 0, 0, false, true)
            // })
        }

        return {editor, createEditor, initEditor, initToolbar, addToolbarItem}
    }
)
