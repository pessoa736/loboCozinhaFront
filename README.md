# loboCozinhaFront

Repositório de front-end do app LoboCozinha contendo os templates HTML e os arquivos estáticos (CSS, imagens) que serão utilizados no repositório do back-end (Django).


## Sumário

- [Visão geral](#visao-geral)
- [Estrutura](#estrutura)
- [Guia do Front: criar templates e testar](#guia-do-front-criar-templates-e-testar)
- [Guia do Back: como integrar no back-end (Django)](#guia-do-back-como-integrar-no-back-end-django)
- [Testes locais dos templates (sem Django)](#testes-locais-dos-templates-sem-django)
- [Erros comuns e dicas](#erros-comuns-e-dicas)
- [Licença](#licenca)


## Visão geral

Este repositório concentra:

- Templates HTML prontos para Django em `templates/`.
- Arquivos estáticos em `static/loboCozinha/` (CSS, imagens, etc.).
- Um pequeno simulador local para visualizar e testar os templates sem subir o projeto Django: `render.test.html` + `render.test.js`.

Objetivo: manter a camada de apresentação desacoplada e fácil de integrar no back-end.

Contexto do projeto: todos os participantes estão em um processo seletivo de uma empresa júnior (EJECT). Este site (repositórios de back e front) é o método de avaliação da etapa atual. A maioria está aprendendo — este README é didático e passo a passo para reduzir dúvidas.


## Estrutura

Visão por perfil de uso:

### Para quem vai integrar (Back-end)

- Você precisa apenas de dois diretórios: `templates/` e `static/loboCozinha/`.
- No Django, inclua componentes como por exemplo `{% include 'ui/header/index.html' %}` e referencie estáticos como `{% static 'loboCozinha/.../arquivo.ext' %}`.

- Crie as páginas no seu projeto Django: adicione uma view em `views.py` e um `path` em `urls.py` apontando para o template desejado.

- Arquivos de teste local (`render.test.html`, `render.test.js`, `render.test.json`) são só para o time de front; não são usados em produção.

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

Nota: essencial apenas para o Front. O objetivo é validar visualmente os componentes sem subir o Django.

Para facilitar a visualização, há um simulador simples baseado em fetch + regex que interpreta um subconjunto das tags do DTL.

- Abra `render.test.html` em um servidor estático simples (recomendado) para evitar bloqueios do navegador ao usar `fetch()` em arquivos locais.
	- Exemplo 1 (Python 3):
		- Entre na pasta do projeto e rode um servidor: `python3 -m http.server 5500`
		- Acesse no navegador: `http://localhost:5500/render.test.html`
	- Exemplo 2 (VS Code - Live Server): clique com botão direito em `render.test.html` > “Open with Live Server”.
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

Exemplo de página completa usando componentes:

Crie `templates/pages/home.html` e inclua componentes do `ui/`:

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
