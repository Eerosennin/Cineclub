<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CartaoFilme from '../components/CartaoFilme.vue'
import { procurarFilmes, listarGeneros, listarRealizadores, fonteActual } from '../services/api'

const route = useRoute()
const router = useRouter()
const fonte = fonteActual()

// Os filtros vivem na URL (?q=...&genero=...) para que o botão "voltar"
// e a partilha de links mantenham a pesquisa feita.
const CAMPOS = ['q', 'genero', 'realizador', 'anoMin', 'anoMax', 'notaMin', 'duracaoMax', 'ordem', 'pagina']

const filtros = reactive(Object.fromEntries(CAMPOS.map((c) => [c, route.query[c] || ''])))
const pesquisa = ref(filtros.q)

const filmes = ref([])
const total = ref(0)
const totalPaginas = ref(1)
const aCarregar = ref(false)
const erro = ref('')
const generos = ref([])
const realizadores = ref([])
const filtrosAbertos = ref(false)

const ordens = computed(() => [
  ...(fonte === 'tmdb' ? [{ v: 'popular', t: 'Mais populares' }] : []),
  { v: 'ano-desc', t: 'Mais recentes' },
  { v: 'ano-asc', t: 'Mais antigos' },
  { v: 'nota-desc', t: 'Melhor classificação' },
  { v: 'nota-asc', t: 'Pior classificação' },
  { v: 'titulo-asc', t: 'Título (A–Z)' },
  ...(fonte === 'ghibli' ? [{ v: 'duracao-asc', t: 'Mais curtos' }] : []),
])

const nFiltrosActivos = computed(
  () => ['genero', 'realizador', 'anoMin', 'anoMax', 'notaMin', 'duracaoMax'].filter((c) => filtros[c]).length,
)

// Sugestões rápidas pensadas para o cineclube
const atalhos = computed(() =>
  fonte === 'tmdb'
    ? [
        { t: '🏆 Clássicos aclamados', f: { ordem: 'nota-desc', anoMax: '1999', notaMin: '8' } },
        { t: '🆕 Estreias recentes', f: { ordem: 'popular', anoMin: String(new Date().getFullYear() - 1) } },
        { t: '😂 Comédia para o fim-de-semana', f: { genero: '35', ordem: 'popular', notaMin: '6.5' } },
        { t: '🎨 Animação', f: { genero: '16', ordem: 'nota-desc' } },
      ]
    : [
        { t: '🏆 Os mais aclamados', f: { ordem: 'nota-desc', notaMin: '9.5' } },
        { t: '⏱️ Sessão curta (< 100 min)', f: { duracaoMax: '100', ordem: 'duracao-asc' } },
        { t: '📼 Clássicos dos anos 80', f: { anoMin: '1980', anoMax: '1989', ordem: 'ano-asc' } },
        { t: '🎨 Só Miyazaki', f: { realizador: 'Hayao Miyazaki' } },
      ],
)

async function carregar() {
  aCarregar.value = true
  erro.value = ''
  try {
    const r = await procurarFilmes({ ...filtros })
    filmes.value = r.filmes
    total.value = r.total
    totalPaginas.value = r.totalPaginas
  } catch (e) {
    erro.value =
      e.status === 401
        ? 'A chave TMDB guardada não é válida. Corrija-a nas Definições.'
        : 'Não foi possível carregar os filmes. Verifique a ligação à Internet e tente de novo.'
    filmes.value = []
  } finally {
    aCarregar.value = false
  }
}

function actualizarUrl() {
  const query = {}
  for (const c of CAMPOS) if (filtros[c] && !(c === 'pagina' && filtros[c] == 1)) query[c] = filtros[c]
  router.replace({ query })
}

function aplicar(reiniciarPagina = true) {
  if (reiniciarPagina) filtros.pagina = ''
  actualizarUrl()
}

function submeterPesquisa() {
  filtros.q = pesquisa.value.trim()
  aplicar()
}

function limpar() {
  for (const c of CAMPOS) filtros[c] = ''
  pesquisa.value = ''
  aplicar()
}

function usarAtalho(a) {
  for (const c of CAMPOS) filtros[c] = ''
  pesquisa.value = ''
  Object.assign(filtros, a.f)
  aplicar()
}

function irPara(p) {
  filtros.pagina = String(p)
  aplicar(false)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// pesquisa "ao escrever" com atraso, para não fazer um pedido por tecla
let temporizador
watch(pesquisa, (v) => {
  clearTimeout(temporizador)
  temporizador = setTimeout(() => {
    if (v.trim() !== filtros.q) submeterPesquisa()
  }, 450)
})

watch(
  () => route.query,
  (q) => {
    if (route.name !== 'inicio') return // a sair da página: não recarregar
    for (const c of CAMPOS) filtros[c] = q[c] || ''
    if (pesquisa.value.trim() !== filtros.q) pesquisa.value = filtros.q
    carregar()
  },
)

onMounted(async () => {
  carregar()
  try {
    ;[generos.value, realizadores.value] = await Promise.all([listarGeneros(), listarRealizadores()])
  } catch {
    /* os filtros de lista ficam vazios; a app continua a funcionar */
  }
})
</script>

<template>
  <section class="hero">
    <h1>Que filme vamos ver na próxima sessão?</h1>
    <p>
      Explore, pesquise e filtre filmes para o cineclube ou para o seu fim-de-semana.
      <span class="etiqueta-fonte">
        Fonte: {{ fonte === 'tmdb' ? 'TMDB (catálogo completo)' : 'Studio Ghibli API' }}
      </span>
    </p>

    <form class="pesquisa" role="search" @submit.prevent="submeterPesquisa">
      <input
        v-model="pesquisa"
        type="search"
        :placeholder="fonte === 'tmdb' ? 'Pesquisar por título…' : 'Pesquisar por título ou realizador…'"
        aria-label="Pesquisar filme"
      />
      <button type="submit" class="btn primario">Pesquisar</button>
    </form>

    <div class="atalhos">
      <button v-for="a in atalhos" :key="a.t" class="chip" @click="usarAtalho(a)">{{ a.t }}</button>
    </div>
  </section>

  <section class="barra-filtros">
    <button class="btn so-movel" @click="filtrosAbertos = !filtrosAbertos">
      Filtros <span v-if="nFiltrosActivos" class="contador">{{ nFiltrosActivos }}</span>
    </button>

    <div class="filtros" :class="{ aberto: filtrosAbertos }">
      <label v-if="generos.length">
        Género
        <select v-model="filtros.genero" @change="aplicar()">
          <option value="">Todos</option>
          <option v-for="g in generos" :key="g.id" :value="g.id">{{ g.nome }}</option>
        </select>
      </label>

      <label v-if="realizadores.length">
        Realizador
        <select v-model="filtros.realizador" @change="aplicar()">
          <option value="">Todos</option>
          <option v-for="r in realizadores" :key="r" :value="r">{{ r }}</option>
        </select>
      </label>

      <label>
        Ano de
        <input v-model="filtros.anoMin" type="number" min="1900" max="2100" placeholder="ex. 1990" @change="aplicar()" />
      </label>
      <label>
        até
        <input v-model="filtros.anoMax" type="number" min="1900" max="2100" placeholder="ex. 2010" @change="aplicar()" />
      </label>

      <label>
        Classificação mínima
        <select v-model="filtros.notaMin" @change="aplicar()">
          <option value="">Qualquer</option>
          <option v-for="n in ['5', '6', '7', '8', '9']" :key="n" :value="n">★ {{ n }}+</option>
        </select>
      </label>

      <label v-if="fonte === 'ghibli'">
        Duração máxima
        <select v-model="filtros.duracaoMax" @change="aplicar()">
          <option value="">Qualquer</option>
          <option value="90">até 90 min</option>
          <option value="110">até 110 min</option>
          <option value="130">até 130 min</option>
        </select>
      </label>

      <label>
        Ordenar por
        <select v-model="filtros.ordem" @change="aplicar()">
          <option value="">Padrão</option>
          <option v-for="o in ordens" :key="o.v" :value="o.v">{{ o.t }}</option>
        </select>
      </label>

      <button v-if="nFiltrosActivos || filtros.q || filtros.ordem" class="btn ligeiro" @click="limpar">
        Limpar tudo
      </button>
    </div>
  </section>

  <p class="resumo" v-if="!aCarregar && !erro">
    <template v-if="total">{{ total.toLocaleString('pt-PT') }} filme(s) encontrado(s)</template>
    <template v-if="filtros.q"> para “{{ filtros.q }}”</template>
  </p>

  <div v-if="erro" class="aviso erro">
    {{ erro }}
    <button class="btn" @click="carregar">Tentar de novo</button>
  </div>

  <div v-else-if="aCarregar" class="grelha">
    <div v-for="n in 8" :key="n" class="cartao esqueleto"></div>
  </div>

  <div v-else-if="!filmes.length" class="vazio">
    <p>😕 Nenhum filme corresponde a esta pesquisa.</p>
    <button class="btn primario" @click="limpar">Limpar filtros</button>
  </div>

  <div v-else class="grelha">
    <CartaoFilme v-for="f in filmes" :key="f.fonte + f.id" :filme="f" />
  </div>

  <nav v-if="totalPaginas > 1 && !aCarregar && !erro" class="paginacao" aria-label="Páginas">
    <button class="btn" :disabled="(+filtros.pagina || 1) <= 1" @click="irPara((+filtros.pagina || 1) - 1)">
      ← Anterior
    </button>
    <span>Página {{ +filtros.pagina || 1 }} de {{ totalPaginas }}</span>
    <button
      class="btn"
      :disabled="(+filtros.pagina || 1) >= totalPaginas"
      @click="irPara((+filtros.pagina || 1) + 1)"
    >
      Seguinte →
    </button>
  </nav>
</template>
