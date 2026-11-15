import { ref, watch } from 'vue'

// "Lista do Cineclube": filmes guardados pelo utilizador para sessões futuras.
// Partilhada por toda a app (estado global simples) e guardada no localStorage.

const CHAVE = 'cineclube.favoritos'

function ler() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || []
  } catch {
    return []
  }
}

const favoritos = ref(ler())

watch(
  favoritos,
  (lista) => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(lista))
    } catch {
      /* storage indisponível */
    }
  },
  { deep: true },
)

export function useFavoritos() {
  const chave = (f) => `${f.fonte}:${f.id}`

  const eFavorito = (f) => favoritos.value.some((x) => chave(x) === chave(f))

  function alternar(f) {
    if (eFavorito(f)) {
      favoritos.value = favoritos.value.filter((x) => chave(x) !== chave(f))
    } else {
      const { id, titulo, ano, nota, poster, fonte, realizador, generos } = f
      favoritos.value.push({ id, titulo, ano, nota, poster, fonte, realizador, generos })
    }
  }

  return { favoritos, eFavorito, alternar }
}
