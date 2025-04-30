<script setup lang="ts">
import {ref} from 'vue'
import {LabelShape, AlignValue, VAlignValue} from '@maxgraph/core'
import {useGraphStore} from "@/stores/graph";

let panels = ref(0)

const components = [
  {
    icon: "@/assets/tcdx.svg",
    title: 'TCDX',
    width: 50,
    height: 50,
    style: {
      fillColor: 'transparent',
      strokeColor: '#000000',
      strokeWidth: '1',
      shape: LabelShape,
      align: 'center',
      verticalAlign: 'bottom',
      imageAlign: 'center',
      imageVerticalAlign: 'top',
      image: "@/assets/tcdx.svg"
    }
  },
  {
    icon: "assets/tcdx.svg",
    title: 'PIE',
    width: 50,
    height: 50,
    style: {
      fillColor: 'transparent',
      strokeColor: '#000000',
      strokeWidth: '1',
      shape: LabelShape,
      align: 'center',
      verticalAlign: 'bottom',
      imageAlign: 'center',
      imageVerticalAlign: 'top',
      image: "@/assets/tcdx.svg"
    }
  },
]
const dragStart = (event: Event) => {
  console.log(event)
}

const addToolbarItem = (item: HTMLDListElement) => {
  const graphStore = useGraphStore()
  const {addToolbarItem} = graphStore
  addToolbarItem(item)
}

// let panels = 0
</script>

<template>
  <div class="libraries">
    <div class="search-container">
      <input class="search-input" placeholder="Search Library" id="search-input"/>
      <v-icon icon="mdi-search"/>
    </div>
    <v-expansion-panels v-model="panels" variant="accordion">
      <v-expansion-panel>
        <v-expansion-panel-title>System Components</v-expansion-panel-title>
        <v-expansion-panel-text class="ma-0">
          <v-row class="pa-0 ma-0">
            <v-card v-for="component in components" :key="component.title"
                    elevation="2"
                    class="pa-2"
                    draggable="true"
                    @dragstart="dragStart($event)"
                    :width="50"
                    :height="50"
                    :ref="(el) => {addToolbarItem(el)}">
              <v-img src="@/assets/tcdx.svg" :width="component['width']" :height="component['height']"/>
              <!--              <v-img :src="component['icon']" :width="component['width']" :height="component['height']"/>-->
            </v-card>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>Engines</v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-card>hello</v-card>
          <v-card>world</v-card>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<style scoped>
.search-input {
  border: 1px;
}
</style>
