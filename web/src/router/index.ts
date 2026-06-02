import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/ViewHome.vue')
    },
    {
      path: '/modeling/:languageId?',
      name: 'Modeling',
      component: () => import('../views/ViewModeling.vue'),
      props: true
    },
    {
      path: '/diagramLanguageEditor/:id?',
      name: 'DiagramLanguageEditor',
      component: () => import('../views/ViewDiagramLanguageEditor.vue'),
      props: true
    },
    {
      path: '/diagramLanguages',
      name: 'DiagramLanguages',
      component: () => import('../views/ViewDiagramLanguageOverview.vue')
    },
    {
      path: '/tasks',
      name: 'Tasks',
      component: () => import('../views/ViewTaskEditor.vue')
    }
  ]
})

export default router
