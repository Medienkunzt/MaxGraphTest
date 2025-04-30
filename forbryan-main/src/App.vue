<script setup lang="ts">
import {RouterLink, RouterView} from 'vue-router'
</script>

<template>
  <div class="app">
    <v-layout>

      <v-app-bar>
        <template v-slot:prepend>
          <v-app-bar-nav-icon></v-app-bar-nav-icon>
        </template>
        <v-app-bar-title>SoC Designer</v-app-bar-title>
        <template v-slot:append>
          <v-btn bg-color=blue icon="mdi-dots-vertical"></v-btn>
        </template>
      </v-app-bar>

      <v-main>
        <nav>
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/editor">Editor</RouterLink>
          <RouterLink to="/graph">Graph</RouterLink>
          <RouterLink to="/about">About</RouterLink>
        </nav>

        <RouterView/>
      </v-main>
    </v-layout>
  </div>
</template>

<style scoped>
.app {
  flex-direction: column;
  place-items: center;
}
</style>
