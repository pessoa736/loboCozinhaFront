
# loboCozinhaFront

Repositório de front-end do app LoboCozinha contendo templates HTML, componentes UI, arquivos estáticos (CSS, imagens) e um sistema de visualização local e via GitHub Pages.



## Visão geral

Este repositório concentra:

- Templates HTML prontos para Django em `templates/`.
- Componentes UI reutilizáveis em `templates/ui/`.
- Arquivos estáticos em `static/loboCozinha/` (CSS, imagens, etc.).
- Sistema de visualização local e via GitHub Pages:
	- `render.test.html` + `render.test.js` para testes locais.
	- Deploy automático dos componentes e página de navegação no GitHub Pages.

Objetivo: manter a camada de apresentação desacoplada, fácil de integrar no back-end e fácil de visualizar/validar.

Contexto do projeto: todos os participantes estão em um processo seletivo de uma empresa júnior (EJECT). Este README é didático e passo a passo para reduzir dúvidas.



## Sumário

- [Estrutura](#estrutura)
- [Guia do Front: criar templates e testar](#guia-do-front-criar-templates-e-testar)
- [Guia do Back: como integrar no back-end (Django)](#guia-do-back-como-integrar-no-back-end-django)
- [Visualização dos componentes no GitHub Pages](#visualizacao-dos-componentes-no-github-pages)
- [Testes locais dos templates (sem Django)](#testes-locais-dos-templates-sem-django)
- [Erros comuns e dicas](#erros-comuns-e-dicas)
- [Licença](#licenca)
## Visualização dos componentes no GitHub Pages

O repositório possui um workflow de deploy automático que publica os componentes UI e uma página de navegação no GitHub Pages.

### Como funciona

- Ao fazer push na branch `master`, o workflow `.github/workflows/gh-pages-render-test.yml` copia os arquivos de componentes e a página de navegação para o diretório público.
- O GitHub Pages exibe:
	- `/index.html`: visualização principal (pode ser o render.test.html ou página inicial).
	- `/ui/index.html`: página de navegação dos componentes UI.
	- `/ui/{componente}/index.html`: cada componente individualmente.

### Como acessar

1. Acesse a URL do GitHub Pages do repositório (exemplo: `https://pessoa736.github.io/loboCozinhaFront/ui/index.html`).
2. Use a página de navegação para visualizar cada componente separadamente.
3. Os arquivos estáticos (CSS, imagens) são servidos automaticamente.

### Como adicionar novos componentes à visualização

1. Crie o componente em `templates/ui/{nome}/index.html`.
2. O workflow irá copiá-lo para `/ui/{nome}/index.html` no deploy.
3. Adicione o nome do componente em `render.test.json` para aparecer no menu do teste local.
4. (Opcional) Atualize a página de navegação (`templates/ui/index.html`) para incluir o novo componente.

### Estrutura publicada no Pages

```
public/
	index.html                # Página principal (render.test.html)
	render.test.js            # Simulador local
	render.test.json          # Lista de componentes
	ui/
		index.html              # Página de navegação dos componentes
		button/index.html       # Componente Button
		carrocel_de_pratos/index.html # Componente Carrocel de Pratos
		footer/index.html       # Componente Footer
		header/index.html       # Componente Header
	static/
		loboCozinha/
			css/
			imgs/
```

### Personalização

Você pode editar `templates/ui/index.html` para criar uma navegação personalizada entre os componentes.





## Estrutura

Visão por perfil de uso:

### Para quem vai criar mais templates (Front-end)

- Crie cada componente em uma pasta com `index.html` em:
  - `templates/ui/{nome}/index.html`, ou
  - `templates/{nome}/index.html`.
- CSS e imagens ficam em `static/loboCozinha/`.
- O nome da pasta do componente é o identificador usado no teste local e deve existir no `render.test.json`.
- O renderizador de teste procura primeiro `./templates/{nome}/index.html` e depois `./templates/ui/{nome}/index.html`.
- Detalhes passo a passo em [Guia do Front](#guia-do-front-criar-templates-e-testar).

Mapa rápido das pastas:

- `templates/` (ex.: `base/index.html`, `ui/header/index.html`)
- `static/loboCozinha/`
	- `css/` (ex.: `base.css`, `header.css`, `footer.css`)
	- `imgs/` (ex.: `logo.png`, `logo2.png`)
- `render.test.html` — página para visualizar componentes/templates localmente (uso: Front).
- `render.test.js` — simulador de algumas tags do Django Template Language (uso: Front).
- `render.test.json` — lista de componentes exibidos no menu do teste (uso: Front).


### Para quem vai integrar (Back-end)

- Você precisa apenas de dois diretórios: `templates/` e `static/loboCozinha/`.
- No Django, inclua componentes como por exemplo `{% include 'ui/header/index.html' %}` e referencie estáticos como `{% static 'loboCozinha/.../arquivo.ext' %}`.

- Crie as páginas no seu projeto Django: adicione uma view em `views.py` e um `path` em `urls.py` apontando para o template desejado.

- Arquivos de teste local (`render.test.html`, `render.test.js`, `render.test.json`) são só para o time de front; não são usados em produção.


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
	 - Suba um servidor estático antes de abrir `render.test.html` (veja seção de testes abaixo) para que o `fetch()` funcione.

Convenções importantes:

- O nome da pasta do componente é o “identificador” que será usado no teste local.
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

5) Registre as páginas nas rotas do Django (views.py e urls.py):

- Em `views.py` do seu app, crie uma view para a página que renderiza um template deste repositório, por exemplo:

```python
# views.py
from django.shortcuts import render

def home(request):
	# Renderiza o template base com includes de header/footer
	return render(request, 'base/index.html')
```

- Em `urls.py` do seu app, aponte uma rota para essa view:

```python
# urls.py
from django.urls import path
from . import views

urlpatterns = [
	path('', views.home, name='home'),
]
```

Dica: componentes em `templates/ui/...` são parciais; normalmente você cria uma página (ex.: `pages/home.html`) que inclui esses componentes e usa essa página na sua view.



## Testes locais dos templates (sem Django)

Essencial para o Front. O objetivo é validar visualmente os componentes sem subir o Django.

### Como testar localmente

1. Abra `render.test.html` em um servidor estático simples para evitar bloqueios do navegador ao usar `fetch()` em arquivos locais.
   - Exemplo 1 (Python 3):
	 - Entre na pasta do projeto e rode: `python3 -m http.server 5500`
	 - Acesse: `http://localhost:5500/render.test.html`
   - Exemplo 2 (VS Code - Live Server): clique com botão direito em `render.test.html` > “Open with Live Server”.
2. No menu da página, escolha um componente/template e clique em "Load" para renderizar.
3. Você pode reposicionar o menu pela UI para não atrapalhar a visualização.

### O que o simulador faz (`render.test.js`)

- Carrega o HTML do componente a partir de:
  - `./templates/{componente}/index.html`, ou
  - `./templates/ui/{componente}/index.html`.
- Processa as seguintes tags do DTL:
  - `{% include '.../index.html' %}` — inclui o HTML de outro componente.
  - `{% load static %}` — mantido como comentário.
  - `{% block nome %}...{% endblock %}` — substituído por um comentário.
  - `{% static 'caminho/relativo.ext' %}` — reescrito para `./static/caminho/relativo.ext`.

### Limites conhecidos

- Não processa `{% extends %}` nem contexto/variáveis do Django.
- O suporte a `{% block %}` é apenas ilustrativo.
- Caminhos em `{% static %}` devem ser relativos ao diretório `static/` deste repositório.

### Como adicionar novos componentes ao teste local

1. Crie o arquivo `index.html` do componente em `templates/ui/{nome}/index.html` (ou em `templates/{nome}/index.html`).
2. Use `{% include '.../index.html' %}` para compor com outros componentes.
3. Referencie estáticos com `{% static 'loboCozinha/.../arquivo.ext' %}`.
4. Adicione o nome no `render.test.json` para aparecer no menu.
5. (Opcional) Adicione a opção no `<select>` de `render.test.html`.

Exemplo de página completa usando componentes:

```html
{% load static %}
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>Home</title>
	<link rel="stylesheet" href="{% static 'loboCozinha/css/base.css' %}">
	<link rel="stylesheet" href="{% static 'loboCozinha/css/header.css' %}">
	<link rel="stylesheet" href="{% static 'loboCozinha/css/footer.css' %}">
</head>
<body>
	{% include 'ui/header/index.html' %}
	<main>
		<h1>Bem-vindo</h1>
	</main>
	{% include 'ui/footer/index.html' %}
</body>
<script src="{% static 'loboCozinha/js/app.js' %}"></script>
</html>
```


## Licença

MIT — veja `LICENSE`.


## Erros comuns e dicas

- Abrir `render.test.html` diretamente (file://) e o menu não carregar: use um servidor (`http://localhost:...`) para o `fetch()` funcionar.
- Esqueceu de adicionar o nome do componente no `render.test.json`: ele não aparece no seletor do teste.
- Nome no `render.test.json` diferente da pasta do componente: o renderizador não encontra o `index.html`.
- Caminho errado no `{% static %}`: garanta o prefixo `loboCozinha/` e que o arquivo exista em `static/loboCozinha/...`.
- Tentar usar `{% extends %}` nos testes locais: não suportado pelo simulador; prefira incluir componentes com `{% include %}`.
