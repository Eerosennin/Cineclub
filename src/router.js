import { createRouter, createWebHashHistory } from 'vue-router'
import Inicio from './views/Inicio.vue'

// Hash history (#/filme/...) para funcionar em alojamento estático
// (GitHub Pages) sem configuração extra do servidor.
export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'inicio', component: Inicio },
    {
      path: '/filme/:fonte/:id',
      name: 'filme',
      component: () => import('./views/FilmeDetalhe.vue'),
      props: true,
    },
    { path: '/lista', name: 'lista', component: () => import('./views/MinhaLista.vue') },
    { path: '/definicoes', name: 'definicoes', component: () => import('./views/Definicoes.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, guardado) {
    return guardado || { top: 0 }
  },
})
