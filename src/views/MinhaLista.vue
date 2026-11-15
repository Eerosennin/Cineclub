<script setup>
import { computed, ref } from 'vue'
import CartaoFilme from '../components/CartaoFilme.vue'
import { useFavoritos } from '../composables/useFavoritos'

const { favoritos } = useFavoritos()
const ordem = ref('adicionado')

const lista = computed(() => {
  const l = [...favoritos.value]
  if (ordem.value === 'nota') l.sort((a, b) => b.nota - a.nota)
  if (ordem.value === 'ano') l.sort((a, b) => (b.ano || 0) - (a.ano || 0))
  if (ordem.value === 'titulo') l.sort((a, b) => a.titulo.localeCompare(b.titulo))
  return l
})

const copiado = ref(false)
async function copiarLista() {
  const texto =
    '🎬 Propostas para o CineClube:\n' +
    lista.value.map((f, i) => `${i + 1}. ${f.titulo} (${f.ano || '—'}) ★ ${f.nota.toFixed(1)}`).join('\n')
  try {
    await navigator.clipboard.writeText(texto)
    copiado.value = true
    setTimeout(() => (copiado.value = false), 2000)
  } catch {
    alert(texto)
  }
}
</script>

<template>
  <section class="cabecalho-pagina">
    <h1>Minha lista</h1>
    <p>Filmes guardados para propor nas próximas sessões. Ficam guardados neste navegador.</p>
  </section>

  <div v-if="!favoritos.length" class="vazio">
    <p>Ainda não guardou nenhum filme. Toque em ♡ num filme para o adicionar.</p>
    <RouterLink to="/" class="btn primario">Explorar filmes</RouterLink>
  </div>

  <template v-else>
    <div class="barra-lista">
      <label>
        Ordenar
        <select v-model="ordem">
          <option value="adicionado">Ordem em que adicionei</option>
          <option value="nota">Melhor classificação</option>
          <option value="ano">Mais recentes</option>
          <option value="titulo">Título (A–Z)</option>
        </select>
      </label>
      <button class="btn" @click="copiarLista">{{ copiado ? '✓ Lista copiada' : '📋 Copiar lista para WhatsApp' }}</button>
    </div>
    <div class="grelha">
      <CartaoFilme v-for="f in lista" :key="f.fonte + f.id" :filme="f" />
    </div>
  </template>
</template>
