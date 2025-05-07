import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: ()=> import('../views/ViewHome.vue')
    },
    {
      path: '/modeling',
      name: 'Modeling',
      component: () => import('../views/ViewModeling.vue')
    },
    {
      path: '/diagramEditor',
      name: 'DiagramEditor',
      component: () => import('../views/ViewDiagramEditor.vue')
    },
  ]
})

export default router
