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
      path: '/modeling',
      name: 'Modeling',
      component: () => import('../views/ViewModeling.vue')
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
    }
  ]
})

export default router
