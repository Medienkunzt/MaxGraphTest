<template>
  <v-app-bar :elevation="1">
    <v-app-bar-title>
      <router-link to="/">
        <IconFBS class="icon" />
      </router-link>
    </v-app-bar-title>

    <template #append>
      <v-btn to="/modeling" active-class="active" prepend-icon="mdi-pencil-ruler">
        <span> Modellierung </span>
        <v-tooltip activator="parent" location="bottom"> Modellierung </v-tooltip>
      </v-btn>
      <v-btn to="/diagramLanguages" active-class="active" prepend-icon="mdi-view-list">
        <span> Sprachen </span>
        <v-tooltip activator="parent" location="bottom"> Diagramsprachen-Übersicht </v-tooltip>
      </v-btn>
      <v-btn to="/diagramLanguageEditor" active-class="active" prepend-icon="mdi-application-edit">
        <span> Editor </span>
        <v-tooltip activator="parent" location="bottom"> Diagramsprachen-Editor </v-tooltip>
      </v-btn>
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
import IconFBS from '@/components/icons/IconFBS.vue'

import { RouterLink } from 'vue-router'
</script>

<style scoped lang="scss">
.icon {
  height: 35px;
  width: auto;
  margin-right: 20px;
}
</style>
