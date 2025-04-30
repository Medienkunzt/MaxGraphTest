<script setup lang="ts">
//@ts-ignore
import TheGraph from '../components/TheGraph.vue'
import Libraries from '../components/Libraries.vue'
</script>

<template>
  <div class="graph-container">
    <div class="graph-toolbar">
      Toolbar <button class="tb-btn">test</button><button class="tb-btn">test2</button>
    </div>
    <div class="graph-main">
      <div class="graph-library">
        <p>Library 2</p>
        <Libraries/>
      </div>
      <div class="graph-graph">
        <TheGraph />
      </div>
      <div class="graph-properties">
        <p>Properties</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* remove width + margin in .graph-container to set back to full size */
.graph-container {
  display: flex;
  flex-direction: column;
  width: 90%;
  margin: auto;
  height: 80vh;
}
.graph-container > * {
  display: flex;
}

/* place-content can be set to center or flex-end to move toolbar items to the center or right, respectively */
.graph-toolbar {
  background-color: red;
  place-items: center;
  place-content: start;
  padding: 0.35em;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}

.graph-toolbar > * {
  margin: 0px 2px;
}

.graph-main {
  height: 100%;
}
.graph-graph {
  width: 75%;
}
.graph-library {
  flex-direction: column;
  width: 20%;
  background: linear-gradient(36deg, blue, lightblue);
}
.graph-properties {
  flex-direction: column;
  width: 12.5%;
  background: linear-gradient(65deg, lightblue, purple);
}

.tb-btn {
  background-color: white;
  border: none;
  padding: 0.35em;
  border-radius: 0.35em;
  transition: background-color 0.4s;
}

.tb-btn:hover {
  background-color: pink;
}
</style>
