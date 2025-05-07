<template>
  <v-container fluid class="home">
    <v-row justify="center" align="center" class="home__row">
      <v-col cols="12" md="8" lg="6" class="home__col">
        <h1 class="home__title">Willkommen bei FBS</h1>
        <p class="home__description">Hier ist die Beschreibung der Anwendung.</p>
        <router-link to="/modeling" class="home__button">Modellierung starten</router-link>
        <router-link to="/diagramEditor" class="home__button">Diagramm-Editor starten</router-link>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss"></style>
