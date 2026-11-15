<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { obterFilme } from '../services/api'
import { useFavoritos } from '../composables/useFavoritos'

const props = defineProps({ fonte: String, id: String })
const router = useRouter()
const { eFavorito, alternar } = useFavoritos()

const filme = ref(null)
const erro = ref('')
const copiado = ref(false)

function duracaoTexto(min) {
  if (!min) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h} h ${m} min` : `${m} min`
}

function voltar() {
  if (window.history.state?.back) router.back()
  else router.push('/')
}

async function partilhar() {
  const texto = `🎬 Proposta para a próxima sessão do cineclube: ${filme.value.titulo} (${filme.value.ano}) — ${location.href}`
  try {
    if (navigator.share) await navigator.share({ title: filme.value.titulo, text: texto, url: location.href })
    else {
      await navigator.clipboard.writeText(texto)
      copiado.value = true
      setTimeout(() => (copiado.value = false), 2000)
    }
  } catch {
    /* utilizador cancelou */
  }
}

onMounted(async () => {
  try {
    filme.value = await obterFilme(props.id, props.fonte)
  } catch (e) {
    erro.value =
      props.fonte === 'tmdb' && e.status === 401
        ? 'Este filme vem da TMDB e é preciso uma chave válida nas Definições para o ver.'
        : 'Não foi possível carregar este filme.'
  }
})
</script>

<template>
  <button class="btn ligeiro voltar" @click="voltar">← Voltar</button>

  <div v-if="erro" class="aviso erro">{{ erro }}</div>

  <div v-else-if="!filme" class="detalhe esqueleto-detalhe"></div>

  <article v-else class="detalhe">
    <div class="banner" v-if="filme.banner" :style="{ backgroundImage: `url(${filme.banner})` }"></div>

    <div class="detalhe-corpo">
      <img v-if="filme.poster" class="detalhe-poster" :src="filme.poster" :alt="`Cartaz de ${filme.titulo}`" />

      <div class="detalhe-info">
        <h1>{{ filme.titulo }}</h1>
        <p class="original" v-if="filme.tituloOriginal && filme.tituloOriginal !== filme.titulo">
          {{ filme.tituloOriginal }}
        </p>

        <div class="etiquetas">
          <span class="chip estatico" v-for="g in filme.generos" :key="g">{{ g }}</span>
        </div>

        <dl class="ficha">
          <div><dt>Ano</dt><dd>{{ filme.ano || '—' }}</dd></div>
          <div><dt>Duração</dt><dd>{{ duracaoTexto(filme.duracao) }}</dd></div>
          <div><dt>{{ filme.fonte === 'tvmaze' ? 'Canal' : 'Realização' }}</dt><dd>{{ filme.realizador || '—' }}</dd></div>
          <div v-if="filme.produtor"><dt>Produção</dt><dd>{{ filme.produtor }}</dd></div>
          <div><dt>Classificação</dt><dd>★ {{ filme.nota.toFixed(1) }} <small>({{ filme.notaTexto }})</small></dd></div>
        </dl>

        <h2>Sinopse <small v-if="filme.fonte !== 'tmdb'" class="nota-pequena">(original em inglês)</small></h2>
        <p class="sinopse">{{ filme.sinopse }}</p>

        <div class="accoes">
          <button class="btn primario" @click="alternar(filme)">
            {{ eFavorito(filme) ? '♥ Na minha lista' : '♡ Adicionar à minha lista' }}
          </button>
          <button class="btn" @click="partilhar">{{ copiado ? '✓ Copiado!' : '↗ Propor ao cineclube' }}</button>
          <a
            v-if="filme.trailer"
            class="btn"
            :href="`https://www.youtube.com/watch?v=${filme.trailer}`"
            target="_blank"
            rel="noopener"
          >▶ Ver trailer</a>
        </div>

        <template v-if="filme.elenco?.length">
          <h2>{{ filme.fonte === 'tmdb' ? 'Elenco principal' : 'Personagens' }}</h2>
          <ul class="elenco">
            <li v-for="p in filme.elenco" :key="p.nome">
              <strong>{{ p.nome }}</strong>
              <span v-if="p.papel">{{ p.papel }}</span>
            </li>
          </ul>
        </template>
      </div>
    </div>
  </article>
</template>
