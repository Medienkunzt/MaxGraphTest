<script setup lang="ts">
//@ts-ignore
import TheEditor from '../components/TheEditor.vue'
// import Libraries from '../components/Libraries.vue'

</script>

<template>
  <div class="editor-container">
<!--    <div class="editor-toolbar">-->
<!--      Toolbar <button class="tb-btn" @click="test">test</button><button class="tb-btn">test2</button>-->
<!--    </div>-->
    <div class="editor-main">
<!--      <div class="editor-library">-->
<!--        <p>Library 2</p>-->
<!--        <Libraries/>-->
<!--      </div>-->
      <div class="editor-graph">
        <TheEditor />
      </div>
<!--      <div class="editor-properties">-->
<!--        <p>Properties</p>-->
<!--      </div>-->
    </div>
  </div>
</template>

<style scoped>
/* remove width + margin in .editor-container to set back to full size */
.editor-container {
  display: flex;
  flex-direction: column;
  width: 90%;
  margin: auto;
  height: 80vh;
}
.editor-container > * {
  display: flex;
}

/* place-content can be set to center or flex-end to move toolbar items to the center or right, respectively */
.editor-toolbar {
  background-color: red;
  place-items: center;
  place-content: start;
  padding: 0.35em;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}

.editor-toolbar > * {
  margin: 0px 2px;
}

.editor-main {
  height: 100%;
}
.editor-graph {
  width: 75%;
}
.editor-library {
  flex-direction: column;
  width: 20%;
  background: linear-gradient(36deg, blue, lightblue);
}
.editor-properties {
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
