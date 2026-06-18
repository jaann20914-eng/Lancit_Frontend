//라우터 생성
import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes.js'
import { setupGuards } from './guards.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

setupGuards(router)

export default router