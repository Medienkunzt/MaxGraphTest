import { createRouter, createWebHashHistory } from 'vue-router'
import { useBearerToken } from '@/composables/useBearerToken'
import { validateToken } from '@/services/authService'
import { useUserStore } from '@/stores/userStore'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/ViewLogin.vue')
    },
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
    },
    {
      path: '/404',
      name: 'View404Page',
      component: () => import('../views/View404Page.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/404'
    }
  ]
})

const nonAdminPages = ['Login', 'Home', 'Modeling', 'View404Page']

router.beforeEach(async (to, from, next) => {
  const publicPages = ['/login']
  const authRequired = !publicPages.includes(to.path)
  const { bearerToken, clearToken } = useBearerToken()
  const loggedIn = bearerToken.value

  const adminRequired = !nonAdminPages.includes(to.name as string)
  const userStore = useUserStore()

  const loginValid = await validateToken().then((response) => {
    if (response === true) {
      return true
    } else {
      clearToken()
      userStore.reset()
      return false
    }
  })

  // trying to access a restricted page + not logged in
  // redirect to login page
  if ((authRequired && !loggedIn) || (authRequired && !loginValid)) {
    next('/login')
  } else if (adminRequired && (await userStore.ensureGlobalRole()) !== 'ADMIN') {
    next('/404')
  } else {
    next()
  }
})

export default router
