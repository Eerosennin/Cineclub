<script setup>
import { ref } from 'vue'
import { getTmdbKey, setTmdbKey, testarChaveTmdb, fonteActual } from '../services/api'

const chave = ref(getTmdbKey())
const fonte = ref(fonteActual())
const estado = ref('')
const aTestar = ref(false)

async function guardar() {
  if (!chave.value.trim()) return remover()
  aTestar.value = true
  estado.value = ''
  const ok = await testarChaveTmdb(chave.value.trim())
  aTestar.value = false
  if (ok) {
    fonte.value = fonteActual()
    estado.value = 'ok'
  } else {
    estado.value = 'falhou'
  }
}

function remover() {
  setTmdbKey('')
  chave.value = ''
  fonte.value = fonteActual()
  estado.value = 'removida'
}
</script>

<template>
  <section class="cabecalho-pagina">
    <h1>Definições</h1>
    <p>Escolha de onde vêm os filmes.</p>
  </section>

  <div class="painel">
    <h2>Fonte de dados actual</h2>
    <p class="fonte-actual">
      <strong>{{ fonte === 'tmdb' ? 'The Movie Database (TMDB)' : 'Studio Ghibli API' }}</strong>
    </p>
    <p v-if="fonte === 'ghibli'">
      Por omissão a aplicação usa a <strong>Studio Ghibli API</strong>, pública e sem necessidade de chave:
      funciona logo, mas tem apenas os filmes do Studio Ghibli (~20 títulos).
    </p>
    <p v-else>A aplicação está a usar o catálogo completo da TMDB, com centenas de milhares de filmes e filtro por género.</p>
  </div>

  <div class="painel">
    <h2>Usar o catálogo completo (TMDB)</h2>
    <ol>
      <li>Crie uma conta gratuita em <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener">themoviedb.org</a>.</li>
      <li>Em <em>Definições → API</em>, peça uma chave (uso pessoal/educativo).</li>
      <li>Cole aqui a <em>API Key</em> (v3) ou o <em>API Read Access Token</em> (v4).</li>
    </ol>

    <form class="form-chave" @submit.prevent="guardar">
      <input v-model="chave" type="password" placeholder="Cole aqui a sua chave TMDB" autocomplete="off" aria-label="Chave TMDB" />
      <button class="btn primario" type="submit" :disabled="aTestar">{{ aTestar ? 'A verificar…' : 'Guardar e testar' }}</button>
      <button v-if="fonte === 'tmdb'" class="btn" type="button" @click="remover">Voltar à Ghibli API</button>
    </form>

    <p v-if="estado === 'ok'" class="aviso sucesso">✓ Chave válida. A aplicação passa a usar a TMDB.</p>
    <p v-if="estado === 'falhou'" class="aviso erro">✗ A TMDB recusou esta chave. Confirme que a copiou inteira.</p>
    <p v-if="estado === 'removida'" class="aviso">Chave removida. A aplicação voltou à Studio Ghibli API.</p>

    <p class="nota-pequena">A chave fica guardada apenas neste navegador (localStorage) e só é enviada à TMDB.</p>
  </div>
</template>
