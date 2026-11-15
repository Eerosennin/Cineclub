# 🎞️ CineClube ISUTC — Explorador de Filmes

Aplicação Web em **Vue.js 3** para explorar uma base de dados de filmes, pensada para o
cineclube universitário do ISUTC e para estudantes que procuram um filme para o fim-de-semana.

Trabalho de reposição de avaliação — Programação Web II, LECC31, 2026 (Docente: Ivan Ruby).
Discente: Ivan jaime Antonio

## Funcionalidades

- **Navegar** pela lista de filmes em grelha, com paginação.
- **Pesquisar** por título (e por realizador, na fonte Ghibli), com pesquisa automática ao escrever.
- **Filtrar** por género (TMDB), realizador (Ghibli), intervalo de anos, classificação mínima e duração; **ordenar** por data, classificação, título ou duração.
- **Atalhos rápidos** ("Os mais aclamados", "Sessão curta", ...).
- **Ver os detalhes** de um filme: cartaz, banner, ficha técnica, sinopse, elenco/personagens e trailer (TMDB).
- **Minha lista**: guardar filmes para propor ao cineclube (fica no `localStorage`) e copiar a lista para o WhatsApp.
- Filtros guardados no URL: o botão "voltar" e links partilhados mantêm a pesquisa.
- Design responsivo (telemóvel e computador) e tema escuro.

## Fontes de dados

| Fonte | Chave | Notas |
|---|---|---|
| [Studio Ghibli API](https://ghibliapi.vercel.app) | Não precisa | Fonte por omissão. ~22 filmes. Funciona logo. |
| [TMDB](https://www.themoviedb.org/documentation/api) | Precisa (grátis) | Catálogo completo, géneros, elenco e trailers. Activa-se colando a chave em **Definições**. |

Ambas são convertidas para o mesmo formato de filme em `src/services/api.js`, por isso o resto da
aplicação não depende da fonte.

## Executar localmente

```bash
npm install
npm run dev       # servidor de desenvolvimento
npm run build     # gera a versão final em dist/
npm run preview   # serve a pasta dist/
```

## Estrutura

```
src/
├── main.js                  # arranque da app
├── App.vue                  # cabeçalho, navegação e rodapé
├── router.js                # rotas (hash history)
├── estilo.css               # estilos globais
├── services/api.js          # acesso às APIs (Ghibli e TMDB) e normalização dos dados
├── composables/useFavoritos.js  # estado partilhado da "Minha lista"
├── components/CartaoFilme.vue   # cartão de um filme na grelha
└── views/
    ├── Inicio.vue           # lista, pesquisa, filtros e paginação
    ├── FilmeDetalhe.vue     # página de um filme
    ├── MinhaLista.vue       # filmes guardados
    └── Definicoes.vue       # escolha da fonte / chave TMDB
```

## Branches

- `main` — versão estável entregue.
- `develop` — ramo de desenvolvimento onde as funcionalidades foram integradas antes de passar para `main`.

## Publicar no GitHub Pages (opcional)

O ficheiro `.github/workflows/deploy.yml` publica automaticamente a pasta `dist/` no GitHub Pages
sempre que há um push para `main` (em *Settings → Pages*, escolher **Source: GitHub Actions**).
Como o `vite.config.js` usa `base: './'` e o router usa hash (`#/`), a app funciona em qualquer subpasta.
