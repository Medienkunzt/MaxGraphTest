import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Components
import App from './App.vue'

// Composables
import router from './router'

// Plugins
import { registerPlugins } from './plugins'
import vuetify from './plugins/vuetify'

import '@maxgraph/core/css/common.css'

import { Client } from '@maxgraph/core'
Client.setImageBasePath('public/images/')

const pinia = createPinia()
const app = createApp(App)
registerPlugins()

app.use(router)
app.use(vuetify)
app.use(pinia)
app.mount('#app')
