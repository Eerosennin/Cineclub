<script setup>
import { ref } from 'vue'
import { getTmdbKey, setTmdbKey, testarChaveTmdb, fonteActual, setFonte, FONTES } from '../services/api'

const chave = ref(getTmdbKey())
const fonte = ref(fonteActual())
const temChave = ref(!!getTmdbKey())
const estado = ref('')
const aTestar = ref(false)

const DESCRICOES = {
  ghibli: 'Pública e sem chave. Tem apenas os filmes do Studio Ghibli (~20 títulos).',
  tvmaze: 'Pública e sem chave. Milhares de séries de TV, com géneros, classificação e elenco.',
  tmdb: 'Catálogo completo de filmes, com filtro por género. Exige uma chave gratuita (ver abaixo).',
}

function escolher(f) {
  if (f === 'tmdb' && !temChave.value) {
    estado.value = 'sem-chave'
    return
  }
  setFonte(f)
  fonte.value = fonteActual()
  estado.value = ''
}

async function guardar() {
  if (!chave.value.trim()) return remover()
  aTestar.value = true
  estado.value = ''
  const ok = await testarChaveTmdb(chave.value.trim())
  aTestar.value = false
  if (ok) {
    temChave.value = true
    setFonte('tmdb')
    fonte.value = fonteActual()
    estado.value = 'ok'
  } else {
    estado.value = 'falhou'
  }
}

function remover() {
  setTmdbKey('')
  chave.value = ''
  temChave.value = false
  fonte.value = fonteActual()
  estado.value = 'removida'
}
</script>

<template>
  <section class="cabecalho-pagina">
    <h1>Definições</h1>
    <p>Escolha de onde vêm os filmes e séries.</p>
  </section>

  <div class="painel">
    <h2>Fonte de dados</h2>
    <div class="lista-fontes">
      <label v-for="(info, id) in FONTES" :key="id" class="opcao-fonte">
        <input type="radio" name="fonte" :value="id" :checked="fonte === id" @change="escolher(id)" />
        <span>
          <strong>{{ info.nome }}</strong>
          <small class="nota-pequena"> — {{ DESCRICOES[id] }}</small>
        </span>
      </label>
    </div>
    <p v-if="estado === 'sem-chave'" class="aviso erro">Para usar a TMDB, guarde primeiro uma chave válida abaixo.</p>
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
      <button v-if="temChave" class="btn" type="button" @click="remover">Remover chave</button>
    </form>

    <p v-if="estado === 'ok'" class="aviso sucesso">✓ Chave válida. A aplicação passa a usar a TMDB.</p>
    <p v-if="estado === 'falhou'" class="aviso erro">✗ A TMDB recusou esta chave. Confirme que a copiou inteira.</p>
    <p v-if="estado === 'removida'" class="aviso">Chave removida.</p>

    <p class="nota-pequena">A chave fica guardada apenas neste navegador (localStorage) e só é enviada à TMDB.</p>
  </div>
</template>

<style scoped>
.lista-fontes { display: grid; gap: 0.6rem; }
.opcao-fonte { display: flex; gap: 0.6rem; align-items: flex-start; cursor: pointer; }
.opcao-fonte input { margin-top: 0.3rem; }
</style>
