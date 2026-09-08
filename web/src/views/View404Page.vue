<template>
  <v-container fluid class="not-found">
    <v-row justify="center" align="center" class="not-found__row">
      <v-col cols="12" md="8" lg="6" class="not-found__col text-center">
        <h1 class="not-found__title">404</h1>
        <p class="not-found__description">Page not found or access not permitted.</p>
        <router-link to="/">Back to home</router-link>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts"></script>
