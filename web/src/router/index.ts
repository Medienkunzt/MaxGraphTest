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
      path: '/diagramLanguageEditor',
      name: 'DiagramLanguageEditor',
      component: () => import('../views/ViewDiagramLanguageEditor.vue')
    }
  ]
})

export default router
