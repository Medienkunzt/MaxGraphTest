import {ref} from 'vue'
import {defineStore} from 'pinia'
import {Graph, InternalEvent, RubberBandHandler, EditorToolbar} from '@maxgraph/core';

export const useGraphStore = defineStore('graph', () => {

        const graph = ref<Graph>()
        const toolbarItems = ref<HTMLDivElement[]>([])

        function createGraph(container: HTMLDivElement) {
            InternalEvent.disableContextMenu(container)
            graph.value = new Graph(container)
        }

        function initGraph() {

            if (graph.value == null) {
                return
            }

            console.log("initializeGraph")

            // Disable the built-in context menu
            // InternalEvent.disableContextMenu(container);
            graph.value.setConnectable(true)
            graph.value.setCellsEditable(false)
            // graph.value.convertValueToString = (cell) => {
            //     return this.R.prop('title', cell)
            // }
            graph.value.setPanning(true); // Use mouse right button for panning
            // WARN: as the maxGraph css files are not available in the npm package (at least for now), dedicated CSS class must be defined in style.css
            new RubberBandHandler(graph.value); // Enables rubber band selection
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

            if (!(toolbarItems.value instanceof Array) || toolbarItems.value.length <= 0) {
                return
            }
            toolbarItems.value.forEach((dom, domIndex) => {
                console.log("domIndex=", domIndex)
                // const toolItem = this.toolbarItems[domIndex]
                // const {width, height} = toolItem
                //
                const dropHandler = (graph, evt, cell, x, y) => {
                    console.log("x,y=",x,y)
                    // this.addCell(toolItem, x, y)
                }
                const createDragPreview = () => {
                    const elt = document.createElement('div')

                    elt.style.border = '2px dotted black'
                    elt.style.width = `${50}px`
                    elt.style.height = `${50}px`
                    return elt
                }

                // EditorToolbar.makeDraggable(dom, this.graph, dropHandler, createDragPreview(), 0, 0, false, true)
            })
        }

        return {graph, createGraph, initGraph, initToolbar, addToolbarItem}
    }
)
