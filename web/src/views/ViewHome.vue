<template>
  <v-container fluid class="home">
    <v-row justify="center" align="center" class="home__row">
      <v-col cols="12" md="8" lg="6" class="home__col">
        <h1 class="home__title">Welcome to FBS</h1>
        <p class="home__description">This is the application description.</p>
        <router-link to="/modeling" class="home__button">Start modeling</router-link>
        <router-link to="/diagramLanguageEditor" class="home__button">Open Diagram Language Editor</router-link>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss"></style>
