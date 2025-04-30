import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import HomeView from '../views/ViewHome.vue'
import ViewModeling from '../views/ViewModeling.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: HomeView
    },
    {
      path: '/modeling',
      name: 'Modeling',
      component: ViewModeling
    }
  ]
})

export default router
