<script setup>
import { useFavoritos } from '../composables/useFavoritos'

const props = defineProps({ filme: { type: Object, required: true } })
const { eFavorito, alternar } = useFavoritos()

function corNota(n) {
  if (n >= 8) return 'alta'
  if (n >= 6) return 'media'
  return 'baixa'
}
</script>

<template>
  <article class="cartao">
    <RouterLink :to="{ name: 'filme', params: { fonte: filme.fonte, id: filme.id } }" class="cartao-link">
      <div class="poster">
        <img v-if="filme.poster" :src="filme.poster" :alt="`Cartaz de ${filme.titulo}`" loading="lazy" />
        <div v-else class="sem-poster">🎬</div>
        <span class="nota" :class="corNota(filme.nota)">★ {{ filme.nota.toFixed(1) }}</span>
      </div>
      <div class="cartao-info">
        <h3>{{ filme.titulo }}</h3>
        <p class="meta">
          {{ filme.ano || '—' }}
          <template v-if="filme.realizador"> · {{ filme.realizador }}</template>
        </p>
        <p class="generos" v-if="filme.generos?.length">{{ filme.generos.slice(0, 3).join(' · ') }}</p>
      </div>
    </RouterLink>
    <button
      class="btn-fav"
      :class="{ activo: eFavorito(filme) }"
      :aria-label="eFavorito(filme) ? 'Remover da minha lista' : 'Adicionar à minha lista'"
      :title="eFavorito(filme) ? 'Remover da minha lista' : 'Adicionar à minha lista'"
      @click="alternar(props.filme)"
    >
      {{ eFavorito(filme) ? '♥' : '♡' }}
    </button>
  </article>
</template>
