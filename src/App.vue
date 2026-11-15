<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useFavoritos } from './composables/useFavoritos'
import { fonteActual, FONTES } from './services/api'

const { favoritos } = useFavoritos()
const route = useRoute()
// recalcula ao mudar de rota (ex.: depois de guardar a chave nas Definições)
const fonte = computed(() => (route.fullPath, fonteActual()))
</script>

<template>
  <header class="topo">
    <div class="contentor topo-in">
      <RouterLink to="/" class="marca">
        <span class="marca-icone">🎞️</span>
        <span>
          <strong>CineClube</strong>
          <small>Explorador de Filmes</small>
        </span>
      </RouterLink>
      <nav>
        <RouterLink to="/">Explorar</RouterLink>
        <RouterLink to="/lista">
          Minha lista <span v-if="favoritos.length" class="contador">{{ favoritos.length }}</span>
        </RouterLink>
        <RouterLink to="/definicoes">Definições</RouterLink>
      </nav>
    </div>
  </header>

  <main class="contentor">
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" :key="$route.path" />
      </Transition>
    </RouterView>
  </main>

  <footer class="rodape">
    <div class="contentor">
      Dados:
      <template v-if="fonte === 'tmdb'">
        <a href="https://www.themoviedb.org/" target="_blank" rel="noopener">The Movie Database (TMDB)</a>
        — este produto usa a API da TMDB mas não é endossado nem certificado pela TMDB.
      </template>
      <template v-else>
        <a :href="FONTES[fonte].url" target="_blank" rel="noopener">{{ FONTES[fonte].nome }}</a>
        (pública, sem chave).
      </template>
      <br />Programação Web II · LECC31 · ISUTC 2026 · Ivan Jaime António
    </div>
  </footer>
</template>
