# loboCozinhaFront

Repositório de front-end do app LoboCozinha contendo os templates HTML e os arquivos estáticos (CSS, imagens) que serão utilizados no repositório do back-end (Django).


## Sumário

- [Visão geral](#visao-geral)
- [Estrutura](#estrutura)
- [Como integrar no back-end (Django)](#como-integrar-no-back-end-django)
- [Testes locais dos templates (sem Django)](#testes-locais-dos-templates-sem-django)
- [Licença](#licença)


## Visão geral

Este repositório concentra:

- Templates HTML prontos para Django em `templates/`.
- Arquivos estáticos em `static/loboCozinha/` (CSS, imagens, etc.).
- Um pequeno simulador local para visualizar e testar os templates sem subir o projeto Django: `render.test.html` + `render.test.js`.

Objetivo: manter a camada de apresentação desacoplada e fácil de integrar no back-end.


## Estrutura

- `templates/` (ex.: `base/index.html`, `ui/header/index.html`)
- `static/loboCozinha/`
	- `css/` (ex.: `base.css`, `header.css`, `footer.css`)
	- `imgs/` (ex.: `logo.png`, `logo2.png`)
- `render.test.html` — página para visualizar componentes/templates localmente.
- `render.test.js` — script que simula algumas tags do Django Template Language (DTL) para testes locais.


## Como integrar no back-end (Django)

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
