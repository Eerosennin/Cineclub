// Camada de acesso a dados.
// Três fontes possíveis, todas convertidas para o mesmo formato de "filme":
//  - Studio Ghibli API (pública, sem chave) — fonte por omissão
//  - TVMaze (pública, sem chave) — milhares de séries de TV
//  - TMDB (The Movie Database) — exige uma chave guardada nas Definições
//
// Formato normalizado:
// { id, titulo, tituloOriginal, ano, realizador, nota (0–10), duracao (min),
//   poster, banner, sinopse, generos: [nomes], fonte }

const GHIBLI = 'https://ghibliapi.vercel.app'
const TVMAZE = 'https://api.tvmaze.com'
const TMDB = 'https://api.themoviedb.org/3'
const TMDB_IMG = 'https://image.tmdb.org/t/p'

const CHAVE_STORAGE = 'cineclube.tmdbKey'
const FONTE_STORAGE = 'cineclube.fonte'

export const FONTES = {
  ghibli: { nome: 'Studio Ghibli API', curto: 'Studio Ghibli API', url: 'https://ghibliapi.vercel.app/' },
  tvmaze: { nome: 'TVMaze (séries de TV)', curto: 'TVMaze (séries)', url: 'https://www.tvmaze.com/api' },
  tmdb: { nome: 'The Movie Database (TMDB)', curto: 'TMDB (catálogo completo)', url: 'https://www.themoviedb.org/' },
}

/* ---------------- Configuração da fonte ---------------- */

export function getTmdbKey() {
  try {
    return localStorage.getItem(CHAVE_STORAGE) || ''
  } catch {
    return ''
  }
}

export function setTmdbKey(chave) {
  try {
    if (chave) localStorage.setItem(CHAVE_STORAGE, chave.trim())
    else localStorage.removeItem(CHAVE_STORAGE)
  } catch {
    /* storage indisponível: ignora */
  }
}

export function setFonte(fonte) {
  try {
    localStorage.setItem(FONTE_STORAGE, fonte)
  } catch {
    /* ignora */
  }
}

export function fonteActual() {
  let escolhida = ''
  try {
    escolhida = localStorage.getItem(FONTE_STORAGE) || ''
  } catch {
    /* ignora */
  }
  if (escolhida === 'tmdb' && !getTmdbKey()) escolhida = ''
  if (FONTES[escolhida]) return escolhida
  // compatibilidade: quem já tinha chave TMDB continua na TMDB
  return getTmdbKey() ? 'tmdb' : 'ghibli'
}

async function pedir(url, opcoes = {}) {
  const resp = await fetch(url, opcoes)
  if (!resp.ok) {
    const erro = new Error(`Erro ${resp.status} ao contactar a API`)
    erro.status = resp.status
    throw erro
  }
  return resp.json()
}

/* ---------------- Studio Ghibli ---------------- */

let cacheGhibli = null

function normalizarGhibli(f) {
  return {
    id: f.id,
    titulo: f.title,
    tituloOriginal: `${f.original_title} (${f.original_title_romanised})`,
    ano: Number(f.release_date),
    realizador: f.director,
    produtor: f.producer,
    nota: Number(f.rt_score) / 10,
    notaTexto: `${f.rt_score}% Rotten Tomatoes`,
    duracao: Number(f.running_time),
    poster: f.image,
    banner: f.movie_banner,
    sinopse: f.description,
    generos: ['Animação'],
    fonte: 'ghibli',
    _people: f.people || [],
  }
}

async function ghibliTodos() {
  if (!cacheGhibli) {
    const dados = await pedir(`${GHIBLI}/films`)
    cacheGhibli = dados.map(normalizarGhibli)
  }
  return cacheGhibli
}

/* ---------------- TVMaze ---------------- */

let cacheTvmaze = null
const PAGINAS_TVMAZE = 4 // 4 × 250 séries carregadas para navegação

const GENEROS_PT = {
  Action: 'Acção', Adventure: 'Aventura', Anime: 'Anime', Comedy: 'Comédia', Crime: 'Crime',
  Drama: 'Drama', Espionage: 'Espionagem', Family: 'Família', Fantasy: 'Fantasia', History: 'História',
  Horror: 'Terror', Legal: 'Jurídico', Medical: 'Médico', Music: 'Música', Mystery: 'Mistério',
  Romance: 'Romance', 'Science-Fiction': 'Ficção científica', Sports: 'Desporto', Supernatural: 'Sobrenatural',
  Thriller: 'Thriller', War: 'Guerra', Western: 'Western', Children: 'Infantil', Food: 'Culinária',
  Nature: 'Natureza', Travel: 'Viagens', DIY: 'Faça você mesmo',
}

function normalizarTvmaze(s) {
  const nota = s.rating?.average || 0
  return {
    id: String(s.id),
    titulo: s.name,
    tituloOriginal: s.name,
    ano: s.premiered ? Number(s.premiered.slice(0, 4)) : null,
    realizador: s.network?.name || s.webChannel?.name || '',
    nota,
    notaTexto: nota ? `${nota.toFixed(1)}/10 (TVMaze)` : 'Sem classificação',
    duracao: s.averageRuntime || s.runtime || null,
    poster: s.image?.medium || s.image?.original || '',
    banner: s.image?.original || '',
    sinopse: (s.summary || '').replace(/<[^>]+>/g, '') || 'Sinopse não disponível.',
    generos: (s.genres || []).map((g) => GENEROS_PT[g] || g),
    fonte: 'tvmaze',
    elenco: (s._embedded?.cast || []).slice(0, 8).map((c) => ({ nome: c.person.name, papel: c.character.name })),
  }
}

async function tvmazeTodos() {
  if (!cacheTvmaze) {
    const paginas = await Promise.all(
      Array.from({ length: PAGINAS_TVMAZE }, (_, i) => pedir(`${TVMAZE}/shows?page=${i}`).catch(() => [])),
    )
    cacheTvmaze = paginas.flat().map(normalizarTvmaze)
  }
  return cacheTvmaze
}

async function procurarTvmaze(f) {
  let lista
  if (f.q) {
    const dados = await pedir(`${TVMAZE}/search/shows?q=${encodeURIComponent(f.q)}`)
    lista = dados.map((d) => normalizarTvmaze(d.show))
  } else {
    lista = await tvmazeTodos()
  }
  if (f.genero) lista = lista.filter((x) => x.generos.includes(f.genero))
  if (f.anoMin) lista = lista.filter((x) => x.ano && x.ano >= Number(f.anoMin))
  if (f.anoMax) lista = lista.filter((x) => x.ano && x.ano <= Number(f.anoMax))
  if (f.notaMin) lista = lista.filter((x) => x.nota >= Number(f.notaMin))
  if (f.duracaoMax) lista = lista.filter((x) => x.duracao && x.duracao <= Number(f.duracaoMax))
  if (!f.q || f.ordem) lista = ordenar(lista, f.ordem || 'nota-desc')
  return paginar(lista, f.pagina, 24)
}

function paginar(lista, paginaPedida, porPagina) {
  const total = lista.length
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
  const pagina = Math.min(Math.max(1, Number(paginaPedida) || 1), totalPaginas)
  const inicio = (pagina - 1) * porPagina
  return { filmes: lista.slice(inicio, inicio + porPagina), pagina, totalPaginas, total }
}

/* ---------------- TMDB ---------------- */

let cacheGeneros = null

function tmdbPedir(caminho, params = {}) {
  const chave = getTmdbKey()
  const url = new URL(TMDB + caminho)
  url.searchParams.set('language', 'pt-PT')
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  }
  const opcoes = {}
  // Chave v4 (token JWT longo) vai no cabeçalho; chave v3 vai na query string
  if (chave.startsWith('eyJ')) {
    opcoes.headers = { Authorization: `Bearer ${chave}` }
  } else {
    url.searchParams.set('api_key', chave)
  }
  return pedir(url.toString(), opcoes)
}

async function tmdbGenerosMapa() {
  if (!cacheGeneros) {
    const dados = await tmdbPedir('/genre/movie/list')
    cacheGeneros = dados.genres
  }
  return cacheGeneros
}

function normalizarTmdb(f, generos = []) {
  const nomesGeneros = f.genres
    ? f.genres.map((g) => g.name)
    : (f.genre_ids || []).map((id) => generos.find((g) => g.id === id)?.name).filter(Boolean)
  const realizador = f.credits?.crew?.find((p) => p.job === 'Director')?.name || ''
  return {
    id: String(f.id),
    titulo: f.title,
    tituloOriginal: f.original_title,
    ano: f.release_date ? Number(f.release_date.slice(0, 4)) : null,
    realizador,
    nota: Math.round((f.vote_average || 0) * 10) / 10,
    notaTexto: `${(f.vote_average || 0).toFixed(1)}/10 (${f.vote_count || 0} votos TMDB)`,
    duracao: f.runtime || null,
    poster: f.poster_path ? `${TMDB_IMG}/w500${f.poster_path}` : '',
    banner: f.backdrop_path ? `${TMDB_IMG}/w1280${f.backdrop_path}` : '',
    sinopse: f.overview || 'Sinopse não disponível em português.',
    generos: nomesGeneros,
    fonte: 'tmdb',
    elenco: (f.credits?.cast || []).slice(0, 8).map((p) => ({ nome: p.name, papel: p.character })),
    trailer: (f.videos?.results || []).find((v) => v.site === 'YouTube' && v.type === 'Trailer')?.key || '',
  }
}



/** Lista de generos disponíveis (so a TMDB tem generos variados). */
export async function listarGeneros() {
  if (fonteActual() === 'tmdb') {
    const g = await tmdbGenerosMapa()
    return g.map((x) => ({ id: String(x.id), nome: x.name }))
  }
  if (fonteActual() === 'tvmaze') {
    const todos = await tvmazeTodos()
    const nomes = [...new Set(todos.flatMap((x) => x.generos))].sort((a, b) => a.localeCompare(b))
    return nomes.map((n) => ({ id: n, nome: n }))
  }
  return []
}

/** Lista de realizadores (para o filtro da fonte Ghibli). */
export async function listarRealizadores() {
  if (fonteActual() !== 'ghibli') return []
  const todos = await ghibliTodos()
  return [...new Set(todos.map((f) => f.realizador))].sort()
}

/**
 * Procura filmes com pesquisa, filtros, ordenação e paginação.
 * filtros: { q, genero, anoMin, anoMax, notaMin, realizador, ordem, pagina }
 * Devolve { filmes, pagina, totalPaginas, total }
 */
export async function procurarFilmes(filtros) {
  const fonte = fonteActual()
  if (fonte === 'tmdb') return procurarTmdb(filtros)
  if (fonte === 'tvmaze') return procurarTvmaze(filtros)
  return procurarGhibli(filtros)
}

const POR_PAGINA_GHIBLI = 12

function ordenar(lista, ordem) {
  const copia = [...lista]
  const regras = {
    'nota-desc': (a, b) => b.nota - a.nota,
    'nota-asc': (a, b) => a.nota - b.nota,
    'ano-desc': (a, b) => b.ano - a.ano,
    'ano-asc': (a, b) => a.ano - b.ano,
    'titulo-asc': (a, b) => a.titulo.localeCompare(b.titulo),
    'duracao-asc': (a, b) => a.duracao - b.duracao,
  }
  return regras[ordem] ? copia.sort(regras[ordem]) : copia
}

function sem_acentos(t) {
  return (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

async function procurarGhibli(f) {
  let lista = await ghibliTodos()
  if (f.q) {
    const termo = sem_acentos(f.q)
    lista = lista.filter(
      (x) =>
        sem_acentos(x.titulo).includes(termo) ||
        sem_acentos(x.tituloOriginal).includes(termo) ||
        sem_acentos(x.realizador).includes(termo),
    )
  }
  if (f.realizador) lista = lista.filter((x) => x.realizador === f.realizador)
  if (f.anoMin) lista = lista.filter((x) => x.ano >= Number(f.anoMin))
  if (f.anoMax) lista = lista.filter((x) => x.ano <= Number(f.anoMax))
  if (f.notaMin) lista = lista.filter((x) => x.nota >= Number(f.notaMin))
  if (f.duracaoMax) lista = lista.filter((x) => x.duracao <= Number(f.duracaoMax))
  lista = ordenar(lista, f.ordem || 'ano-desc')

  return paginar(lista, f.pagina, POR_PAGINA_GHIBLI)
}

const ORDEM_TMDB = {
  'nota-desc': 'vote_average.desc',
  'nota-asc': 'vote_average.asc',
  'ano-desc': 'primary_release_date.desc',
  'ano-asc': 'primary_release_date.asc',
  'titulo-asc': 'title.asc',
  popular: 'popularity.desc',
}

async function procurarTmdb(f) {
  const generos = await tmdbGenerosMapa()
  const pagina = Math.max(1, Number(f.pagina) || 1)
  let dados

  if (f.q) {
    // O endpoint de pesquisa não aceita filtros de género/nota: aplicam-se no cliente
    dados = await tmdbPedir('/search/movie', { query: f.q, page: pagina, include_adult: false })
    let lista = dados.results.map((x) => normalizarTmdb(x, generos))
    if (f.genero) {
      const nome = generos.find((g) => String(g.id) === String(f.genero))?.name
      lista = lista.filter((x) => x.generos.includes(nome))
    }
    if (f.anoMin) lista = lista.filter((x) => x.ano && x.ano >= Number(f.anoMin))
    if (f.anoMax) lista = lista.filter((x) => x.ano && x.ano <= Number(f.anoMax))
    if (f.notaMin) lista = lista.filter((x) => x.nota >= Number(f.notaMin))
    if (f.ordem && f.ordem !== 'popular') lista = ordenar(lista, f.ordem)
    return {
      filmes: lista,
      pagina,
      totalPaginas: Math.min(dados.total_pages || 1, 500),
      total: dados.total_results,
    }
  }

  dados = await tmdbPedir('/discover/movie', {
    page: pagina,
    include_adult: false,
    sort_by: ORDEM_TMDB[f.ordem] || 'popularity.desc',
    with_genres: f.genero,
    'primary_release_date.gte': f.anoMin ? `${f.anoMin}-01-01` : '',
    'primary_release_date.lte': f.anoMax ? `${f.anoMax}-12-31` : '',
    'vote_average.gte': f.notaMin,
    // evita filmes com 1 ou 2 votos no topo quando se ordena por nota
    'vote_count.gte': f.ordem?.startsWith('nota') ? 200 : 20,
  })
  return {
    filmes: dados.results.map((x) => normalizarTmdb(x, generos)),
    pagina,
    totalPaginas: Math.min(dados.total_pages || 1, 500),
    total: dados.total_results,
  }
}

const GENERO_PT = { Male: 'Masculino', Female: 'Feminino', NA: '' }

/** Detalhes completos de um filme. */
export async function obterFilme(id, fonte = fonteActual()) {
  if (fonte === 'tmdb') {
    const f = await tmdbPedir(`/movie/${id}`, { append_to_response: 'credits,videos' })
    return normalizarTmdb(f)
  }
  if (fonte === 'tvmaze') {
    return normalizarTvmaze(await pedir(`${TVMAZE}/shows/${id}?embed=cast`))
  }
  const todos = await ghibliTodos()
  let filme = todos.find((x) => x.id === id)
  if (!filme) filme = normalizarGhibli(await pedir(`${GHIBLI}/films/${id}`))

  // Personagens: a API devolve URLs; o primeiro pode ser o endpoint genérico "/people/"
  const urls = filme._people.filter((u) => !u.endsWith('/people/')).slice(0, 8)
  const pessoas = await Promise.all(
    urls.map((u) => pedir(u).catch(() => null)),
  )
  return {
    ...filme,
    elenco: pessoas.filter(Boolean).map((p) => ({
      nome: p.name,
      papel: [GENERO_PT[p.gender] || p.gender, p.age && `idade: ${p.age}`].filter(Boolean).join(' · '),
    })),
  }
}

/** Testa uma chave TMDB antes de a guardar. */
export async function testarChaveTmdb(chave) {
  const anterior = getTmdbKey()
  setTmdbKey(chave)
  try {
    await tmdbPedir('/genre/movie/list')
    cacheGeneros = null
    return true
  } catch {
    setTmdbKey(anterior)
    return false
  }
}
