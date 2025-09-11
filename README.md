# loboCozinhaFront

Repositório de front-end do app LoboCozinha contendo os templates HTML e os arquivos estáticos (CSS, imagens) que serão utilizados no repositório do back-end (Django).


## Sumário

- [Visão geral](#visao-geral)
- [Estrutura](#estrutura)
- [Guia do Front: criar templates e testar](#guia-do-front-criar-templates-e-testar)
- [Guia do Back: como integrar no back-end (Django)](#guia-do-back-como-integrar-no-back-end-django)
- [Testes locais dos templates (sem Django)](#testes-locais-dos-templates-sem-django)
- [Licença](#licença)


## Visão geral

Este repositório concentra:

- Templates HTML prontos para Django em `templates/`.
- Arquivos estáticos em `static/loboCozinha/` (CSS, imagens, etc.).
- Um pequeno simulador local para visualizar e testar os templates sem subir o projeto Django: `render.test.html` + `render.test.js`.

Objetivo: manter a camada de apresentação desacoplada e fácil de integrar no back-end.


## Estrutura

- `templates/` 
	- ... 
	(ex.: `base/index.html`, `ui/header/index.html`)

- `static/loboCozinha/`
	- `css/` (ex.: `base.css`, `header.css`, `footer.css`)
	- `imgs/` (ex.: `logo.png`, `logo2.png`)

- `render.test.html` — página para visualizar componentes/templates localmente.

- `render.test.js` — script que simula algumas tags do Django Template Language (DTL) para testes locais.


## Guia do Front: criar templates e testar

Este guia é para quem está desenvolvendo no front e precisa criar novos templates/componentes e testá‑los localmente.

### Como criar um novo template/componente

1) Crie uma pasta para o componente e um `index.html`:
	 - Caminhos suportados pelo renderizador:
		 - `templates/ui/{nomeDoComponente}/index.html`, ou
		 - `templates/{nomeDoComponente}/index.html`.
2) (Opcional) Adicione CSS/estáticos específicos do componente em:
	 - `static/loboCozinha/css/{nomeDoComponente}.css`
	 - `static/loboCozinha/imgs/...` (imagens)
3) Dentro do `index.html`, use as tags do Django que o simulador entende:
	 - Carregar estáticos: `{% load static %}`
	 - Referenciar arquivos: `<link rel="stylesheet" href="{% static 'loboCozinha/css/{nomeDoComponente}.css' %}">`
	 - Incluir outros componentes: `{% include 'ui/header/index.html' %}` (ou caminhos equivalentes)
4) Dicas:
	 - O simulador reescreve `{% static '...' %}` para `./static/...` ao rodar localmente.
	 - `extends` não é suportado; `block` é apenas ilustrativo no teste local.

Convenções importantes:

- O nome da pasta do componente é o ""“identificador”"" que será usado no teste local.
- Use nomes simples, sem espaços. Ex.: `header`, `footer`, `button`, `card`.
- Esse nome deve ser exatamente igual ao cadastrado no `render.test.json` (veja abaixo).

### Como adicionar o componente ao renderizador de teste

1) Abra `render.test.json` na raiz do projeto.
2) Adicione uma string com o nome do componente na lista. Exemplos:

```
[
	"header",
	"footer",
	"button",
	"base",
	"card"  // novo componente
]
```

Regras importantes:

- O valor deve ser exatamente igual ao nome da pasta do template que você criou.
	- Se você criou `templates/ui/card/index.html`, então adicione `"card"` no `render.test.json`.
- O renderizador buscará, em ordem:
	- `./templates/{nome}/index.html`
	- `./templates/ui/{nome}/index.html`
- Depois de salvar o JSON, recarregue a página `render.test.html` no navegador; o menu será populado automaticamente a partir desse arquivo.


## Guia do Back: como integrar no back-end (Django)

Para quem está no back-end: basta copiar estes diretórios para dentro do app do Django.

Passo a passo recomendado (ajuste ao seu projeto, se necessário):

1) Dentro do seu app Django (ex.: `lobocozinha/`), crie as pastas caso não existam:
	 - `lobocozinha/templates/`
	 - `lobocozinha/static/`

2) Copie o conteúdo deste repositório:
	 - De `templates/` para `lobocozinha/templates/`
	 - De `static/loboCozinha/` para `lobocozinha/static/loboCozinha/`

3) Nas configurações do Django, garanta que:
	 - O app (`lobocozinha`) está em `INSTALLED_APPS`.
	 - O `TEMPLATES` está configurado para achar templates do app (por padrão, Django encontra `app_name/templates/`).
	 - O `STATICFILES_DIRS`/`STATIC_URL`/`STATIC_ROOT` estejam de acordo com o seu fluxo (collectstatic, etc.).

4) Uso dentro dos templates no Django:
	 - Carregue os estáticos: `{% load static %}`
	 - Inclua componentes: `{% include 'ui/header/index.html' %}` e `{% include 'ui/footer/index.html' %}`
	 - Referencie arquivos estáticos: `{% static 'loboCozinha/css/base.css' %}` e `{% static 'loboCozinha/imgs/logo.png' %}`

Observação: a pasta `loboCozinha/` é o namespace dos arquivos estáticos dentro do app. Ajuste o caminho caso use outra convenção.


## Testes locais dos templates (sem Django)

Para facilitar a visualização, há um simulador simples baseado em fetch + regex que interpreta um subconjunto das tags do DTL.

- Abra `render.test.html` em um servidor estático simples (recomendado) para evitar bloqueios do navegador ao usar `fetch()` em arquivos locais.
- No menu da página, escolha um componente/template (Base, Header, Footer) e clique em "Load" para renderizar.
- Você pode reposicionar o menu pela UI para não atrapalhar a visualização.

O que o simulador faz (`render.test.js`):

- Carrega o HTML do componente a partir de:
	- `./templates/{componente}/index.html`, ou
	- `./templates/ui/{componente}/index.html`.
- Procura e processa (por regex) as seguintes tags do DTL:
	- `{% include '.../index.html' %}` — inclui o HTML de outro componente.
	- `{% load static %}` — mantido como comentário (apenas marcador).
	- `{% block nome %}...{% endblock %}` — substituído por um comentário indicando o bloco.
	- `{% static 'caminho/relativo.ext' %}` — reescrito para `./static/caminho/relativo.ext` para funcionar localmente.

Limites conhecidos do simulador:

- Não processa `{% extends %}` nem contexto/variáveis do Django.
- O suporte a `{% block %}` é apenas ilustrativo (não há herança real de templates).
- Caminhos em `{% static %}` devem ser relativos ao diretório `static/` deste repositório.

Como adicionar novos componentes ao teste local:

1) Crie o arquivo `index.html` do componente em `templates/ui/{nome}/index.html` (ou em `templates/{nome}/index.html`).
2) Use `{% include '.../index.html' %}` para compor com outros componentes.
3) Referencie estáticos com `{% static 'loboCozinha/.../arquivo.ext' %}` — o simulador reescreve para `./static/...` localmente.
4) (Opcional) Adicione a opção no `<select>` de `render.test.html` para facilitar a seleção do novo componente.


## Licença

MIT — veja `LICENSE`.
