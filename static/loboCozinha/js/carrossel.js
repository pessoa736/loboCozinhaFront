

/*
	Carrossel(referencia, itens, opcoes?)

	Objetivo
	- Componente JS reaproveitável para carrossel horizontal (loop infinito) sem dependências.
	- Espera um wrapper contendo:
			.carrossel-container (lista), .leftbt (anterior) e .rightbt (próximo). Botões são opcionais.
	- Aceita renderer customizado para o HTML de cada item.

	Maneiras de usar

	1) O jeito mais simples (sem JS inline) — auto-scan com JSON
		 Basta incluir o script do carrossel e um <script type="application/json" data-items> com os itens
		 dentro do wrapper .carrossel. O módulo inicializa sozinho.

		 <div class="carrossel" id="meuWrap">
			 <button class="leftbt">‹</button>
			 <div class="carrossel-container" id="meuContainer"></div>
			 <button class="rightbt">›</button>
			 <script src="/static/loboCozinha/js/carrossel.js"></script>
			 <script type="application/json" data-items>
				 [
					 { "src": "/static/loboCozinha/imgs/prato1.png", "nome": "Item 1" },
					 { "src": "/static/loboCozinha/imgs/prato2.png", "nome": "Item 2" }
				 ]
			 </script>
		 </div>

		 Alternativas:
		 - Coloque o JSON direto em data-items='[...]' no wrapper; ou
		 - data-items="#idDoScriptJson" apontando para um <script type="application/json"> fora do wrapper.

	2) Inicialização manual (caso prefira controlar via JS)

		 <script src="/static/loboCozinha/js/carrossel.js"></script>
		 <script>
			 // Campos suportados por padrão (aliases):
			 // imagem | image | img | src  e  titulo | title | nome | prato_nome
			 const itens = [ { imagem: '...', titulo: 'Item 1' }, { src: '...', nome: 'Item 2' } ];
			 const c = Carrossel('#meuWrap', itens);
			 // c.next(); c.prev(); c.render(novosItens);
		 </script>

		 Também aceita referência direta ao container:
			 const c = Carrossel('#meuContainer', itens);

	3) Renderer customizado (HTML próprio por item)

		 const c = Carrossel('#meuWrap', itens, {
			 renderer: (item, classes) => {
				 const el = document.createElement('div');
				 el.className = classes.itemClass; // mantenha a classe para o layout
				 el.innerHTML = `<img src="${item.src}"><h3>${item.titulo || item.nome || ''}</h3>`;
				 return el;
			 }
		 });

	Avançado
	- Referência como objeto: Carrossel({ container: '#meuContainer', prev: '.leftbt', next: '.rightbt' }, itens)
	- Auto re-scan para conteúdo dinâmico: document.dispatchEvent(new Event('carrossel:scan'))
	- O módulo dispara 'carrossel:ready' quando disponível.
*/
(function (global) {
	function resolveEl(ref) {
		if (!ref) return null;
		if (typeof ref === 'string') return document.querySelector(ref);
		if (ref && ref.nodeType === 1) return ref; // HTMLElement
		return null;
	}

	function waitImagesLoaded(container) {
		const imgs = Array.from(container.querySelectorAll('img'));
		if (imgs.length === 0) return Promise.resolve();
		const pending = imgs.filter((img) => !img.complete || img.naturalWidth === 0);
		if (pending.length === 0) return Promise.resolve();
		return new Promise((resolve) => {
			let left = pending.length;
			const done = () => { if (--left === 0) resolve(); };
			pending.forEach((img) => {
				img.addEventListener('load', done, { once: true });
				img.addEventListener('error', done, { once: true });
			});
		});
	}

	function defaultRenderer(item, cls) {
		// Suporta alguns aliases: imagem|image|src, titulo|title|nome|prato_nome
		const src = item.prato_imagem || item.imagem || item.image || item.img || item.src || '';
		const title = item.prato_nome || item.nome || item.title || item.titulo || '';
		const el = document.createElement('div');
		el.className = cls.itemClass;
		el.innerHTML = `
			<img src="${src}" alt="${title}">
			<h3>${title}</h3>
		`;
		return el;
	}

	function ensureItemEl(el, cls) {
		if (typeof el === 'string') {
			const wrap = document.createElement('div');
			wrap.className = cls.itemClass;
			wrap.innerHTML = el;
			return wrap;
		}
		if (el && el.nodeType === 1) {
			// Garante classe para estilos do carrossel
			if (!el.classList.contains(cls.itemClass)) {
				el.classList.add(cls.itemClass);
			}
			return el;
		}
		// Fallback vazio
		const empty = document.createElement('div');
		empty.className = cls.itemClass;
		return empty;
	}

	function Carrossel(referencia, itens, opcoes) {
		const opts = Object.assign(
			{
				selectorContainer: '.carrossel-container',
				selectorPrev: '.leftbt',
				selectorNext: '.rightbt',
				itemClass: 'prato-item',
				centerClass: 'is-center',
				transitionMs: 450,
				renderer: null, // (item, classes) => HTMLElement|string
				onCenteredChange: null, // (element, index) => void
			},
			opcoes || {}
		);

		// Normalização da referência
		let container = null;
		let wrapper = null;
		let prevBtn = null;
		let nextBtn = null;

		// Aceita objeto avançado: { container, prev, next }
		const isAdvancedObj =
			referencia && typeof referencia === 'object' && referencia.nodeType !== 1 &&
			(referencia.container || referencia.prev || referencia.next);

		if (isAdvancedObj) {
			container = resolveEl(referencia.container);
			wrapper = container ? container.parentElement : null;
			prevBtn = resolveEl(referencia.prev) || (wrapper && wrapper.querySelector(opts.selectorPrev));
			nextBtn = resolveEl(referencia.next) || (wrapper && wrapper.querySelector(opts.selectorNext));
		} else {
			const el = resolveEl(referencia);
			if (!el) {
				console.error('Carrossel: referência não encontrada:', referencia);
				return null;
			}
			if (el.matches && el.matches(opts.selectorContainer)) {
				container = el;
				wrapper = el.parentElement || el;
			} else {
				wrapper = el;
				container = wrapper.querySelector(opts.selectorContainer) || el;
			}
			prevBtn = wrapper.querySelector(opts.selectorPrev);
			nextBtn = wrapper.querySelector(opts.selectorNext);
		}

		if (!container) {
			console.error('Carrossel: container não encontrado.');
			return null;
		}

		const classes = { itemClass: opts.itemClass, centerClass: opts.centerClass };
		const renderItem = typeof opts.renderer === 'function'
			? (item) => ensureItemEl(opts.renderer(item, classes), classes)
			: (item) => defaultRenderer(item, classes);

		let data = Array.isArray(itens) ? itens.slice() : [];
		let isAnimating = false;

		function getStepPx() {
			const children = container ? container.children : [];
			if (!container || children.length < 2) {
				const first = children[0];
				return first ? first.getBoundingClientRect().width : 0;
			}
			const a = children[0].getBoundingClientRect();
			const b = children[1].getBoundingClientRect();
			const delta = b.left - a.left; // inclui gap
			return Math.abs(delta) || a.width;
		}

		function updateCenterHighlight() {
			if (!container) return;
			const itemsEls = Array.from(container.querySelectorAll('.' + classes.itemClass));
			if (itemsEls.length === 0) return;
			const base = container.parentElement || container;
			const wrapRect = base.getBoundingClientRect();
			const targetX = wrapRect.left + wrapRect.width / 2;
			let best = null;
			let bestDist = Infinity;
			let bestIdx = -1;
			itemsEls.forEach((el, i) => {
				const r = el.getBoundingClientRect();
				const cx = r.left + r.width / 2;
				const dist = Math.abs(cx - targetX);
				if (dist < bestDist) {
					bestDist = dist;
					best = el;
					bestIdx = i;
				}
			});
			itemsEls.forEach((el) => el.classList.remove(classes.centerClass));
			if (best) {
				best.classList.add(classes.centerClass);
				if (typeof opts.onCenteredChange === 'function') {
					opts.onCenteredChange(best, bestIdx);
				}
			}
		}

		function render(newItems) {
			if (Array.isArray(newItems)) data = newItems.slice();
			container.innerHTML = '';
			const frag = document.createDocumentFragment();
			data.forEach((item) => {
				const el = renderItem(item);
				frag.appendChild(el);
			});
			container.appendChild(frag);
			return waitImagesLoaded(container).then(updateCenterHighlight);
		}

		function move(dir = 1) {
			if (!container || isAnimating) return;
			const children = container.children;
			if (!children || children.length < 2) return;
			const step = getStepPx();
			if (!step || step <= 0) return;

			isAnimating = true;
			container.style.willChange = 'transform';
			const transition = `transform ${opts.transitionMs}ms ease`;

			if (dir === 1) {
				container.style.transition = transition;
				container.style.transform = `translateX(${-step}px)`;
				const onEnd = () => {
					container.removeEventListener('transitionend', onEnd);
					if (container.firstElementChild) {
						container.appendChild(container.firstElementChild);
					}
					container.style.transition = 'none';
					container.style.transform = 'translateX(0)';
					void container.offsetHeight; // reflow
					container.style.willChange = '';
					isAnimating = false;
					updateCenterHighlight();
				};
				container.addEventListener('transitionend', onEnd, { once: true });
			} else {
				if (container.lastElementChild) {
					container.insertBefore(container.lastElementChild, container.firstElementChild);
				}
				container.style.transition = 'none';
				container.style.transform = `translateX(${-step}px)`;
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						container.style.transition = transition;
						container.style.transform = 'translateX(0)';
						const onEnd = () => {
							container.removeEventListener('transitionend', onEnd);
							container.style.transition = 'none';
							container.style.transform = 'translateX(0)';
							void container.offsetHeight;
							container.style.willChange = '';
							isAnimating = false;
							updateCenterHighlight();
						};
						container.addEventListener('transitionend', onEnd, { once: true });
					});
				});
			}
		}

		function next() { move(1); }
		function prev() { move(-1); }

		function attachButtons(pBtn, nBtn) {
			if (pBtn) pBtn.addEventListener('click', prev);
			if (nBtn) nBtn.addEventListener('click', next);
		}

		function detachButtons(pBtn, nBtn) {
			if (pBtn) pBtn.removeEventListener('click', prev);
			if (nBtn) nBtn.removeEventListener('click', next);
		}

		let resizeHandler = () => { requestAnimationFrame(updateCenterHighlight); };
		window.addEventListener('resize', resizeHandler);
		attachButtons(prevBtn, nextBtn);

		// render inicial
		render();

		function destroy() {
			detachButtons(prevBtn, nextBtn);
			window.removeEventListener('resize', resizeHandler);
			// Limpa estilos inline de animação
			if (container) {
				container.style.transition = '';
				container.style.transform = '';
				container.style.willChange = '';
			}
		}

		function getState() {
			return {
				container,
				wrapper,
				count: container ? container.children.length : 0,
				isAnimating,
			};
		}

		return {
			render,
			move,
			next,
			prev,
			updateCenterHighlight,
			attachButtons,
			detachButtons,
			destroy,
			getState,
		};
	}

	// Exporta globalmente
		global.Carrossel = Carrossel;
		// Auto-scan helpers para inicialização sem inline JS
		function parseItemsFromWrapper(wrapper) {
			if (!wrapper) return null;
			// 1) data-items="..." (JSON direto) ou seletor para <script type="application/json">
			const dataAttr = wrapper.getAttribute('data-items');
			if (dataAttr) {
				const raw = dataAttr.trim();
				if (raw.startsWith('#')) {
					const target = document.querySelector(raw);
					if (target) {
						try { return JSON.parse(target.textContent || '[]'); } catch(_) { return null; }
					}
				} else {
					try { return JSON.parse(raw); } catch(_) {}
				}
			}
			// 2) <script type="application/json" data-items> (preferido)
			const s = wrapper.querySelector('script[type="application/json"][data-items], script[type="application/json"].carrossel-items');
			if (s) {
				try { return JSON.parse(s.textContent || '[]'); } catch(_) { return null; }
			}
			return null;
		}

		function autoScan(root) {
			const scope = root || document;
			const candidates = scope.querySelectorAll('.carrossel');
			candidates.forEach((wrap) => {
				if (wrap.__carrosselInitialized) return;
				const items = parseItemsFromWrapper(wrap);
				if (Array.isArray(items) && items.length) {
					try {
						Carrossel(wrap, items);
						wrap.__carrosselInitialized = true;
					} catch (e) { console.error('Carrossel autoScan falhou:', e); }
				}
			});
		}

		global.Carrossel.autoScan = autoScan;
		// Eventos para facilitar integração
		try {
			document.addEventListener('DOMContentLoaded', () => autoScan());
			setTimeout(() => autoScan(), 0);
			document.addEventListener('carrossel:scan', () => autoScan());
		} catch(_) {}

		try { document.dispatchEvent(new Event('carrossel:ready')); } catch(_) {}
})(window);
