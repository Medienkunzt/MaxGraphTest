<template>
  <v-app>
    <HeaderMain />

    <v-main>
      <RouterView />
    </v-main>

    <FooterMain />
  </v-app>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'

import FooterMain from '@/components/layout/FooterMain.vue'
import HeaderMain from '@/components/layout/HeaderMain.vue'

onMounted(() => {})
</script>

<style scoped lang="scss"></style>
