

function procurarDTLs(html) {
    
    // Regexes para encontrar DTLs básicos + include com parâmetros opcionais
    // include agora suporta: {% include 'ui/button/index.html' with text='Reservar' outro="X" %}
    const include = [/{%\s*include\s*['"](?:\.\/)?(.+?)\/index\.html['"](?:\s+with\s+([^%]+?))?\s*%}/g, "include"]; // group1 = caminho, group2 = params
    const loadStatic = [/{%\s*load\s+static\s*%}/g, "loadStatic"]; 
    const getStaticPrefix = [/{%\s*get_static_prefix\s*%}/g, "getStaticPrefix"]; 
    
    
    // block: captura nome e conteúdo interno (group2)
    const block = [/{%\s*block\s+([A-Za-z0-9_]+)\s*%}([\s\S]*?){%\s*endblock\s*%}/g, "block"]; 
    const staticTag = [/{%\s*static\s*['"](?!https?:\/\/)(?:\.\/)?(.+?)['"]\s*%}/g, "static"]; 

    

    let resultados = [];

    
    
    [include, loadStatic, getStaticPrefix, block, staticTag].forEach((r)=>{
        let regex = r[0];
        let match = regex.exec(html);
        
        while (match !== null) {
            
            const item = {
                nome: match[1],
                type: r[1],
                posicao: match.index,
                original: match[0]
            };
            
            if (r[1] === 'block') {
                item.inner = match[2] || '';
            }
            
            if (r[1] === 'include') {
                item.paramString = match[2] || '';
            }
            
            resultados.push(item);
            match = regex.exec(html);
        }
    });


    // Ordena por posição para substituição correta depois
    resultados.sort((a, b) => a.posicao - b.posicao);


    console.log('DTLs encontrados:', resultados);
    return resultados;
}





async function substituirDTLsPorJS(html, DTLs, contextoAtual, opts){
    
    
    // Funções de substituição para cada tipo
    const substituicoes = {
        
    "include": async (dtl) => {
            const params = {};
            if (dtl.paramString) {
                // Pré-processa occurrences de {% static 'path' %} ou {% static "path" %}
                const staticInnerRegex = /{%\s*static\s+(['"])(.+?)\1\s*%}/g;
                const staticMap = {};
                let idx = 0;
                let cleaned = dtl.paramString;
                let sm = staticInnerRegex.exec(dtl.paramString);
                while (sm) {
                    const placeholder = `__STATIC_PLACEHOLDER_${idx}__`;
                    staticMap[placeholder] = `./static/${sm[2]}`; // caminho relativo final
                    cleaned = cleaned.replace(sm[0], placeholder);
                    idx++;
                    sm = staticInnerRegex.exec(dtl.paramString);
                }

                // Agora faz split mais robusto respeitando aspas simples/duplas
                // Estratégia: tokenizar manualmente
                const tokens = [];
                let buffer = '';
                let quote = null;
                for (let i = 0; i < cleaned.length; i++) {
                    const ch = cleaned[i];
                    if (quote) {
                        if (ch === quote) {
                            buffer += ch; quote = null; continue;
                        }
                        buffer += ch; continue;
                    } else {
                        if (ch === '"' || ch === "'") { quote = ch; buffer += ch; continue; }
                        if (/\s/.test(ch)) {
                            if (buffer.trim()) { tokens.push(buffer.trim()); buffer=''; }
                            continue;
                        }
                        buffer += ch;
                    }
                }
                if (buffer.trim()) tokens.push(buffer.trim());

                // Recompõe pares chave=valor (valor pode ter = se dentro de aspas)
                tokens.forEach(t => {
                    const eqIdx = t.indexOf('=');
                    if (eqIdx === -1) return;
                    const key = t.slice(0, eqIdx).trim();
                    let value = t.slice(eqIdx+1).trim();
                    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }
                    // repõe placeholders static
                    Object.keys(staticMap).forEach(ph => {
                        if (value.includes(ph)) value = value.replace(ph, staticMap[ph]);
                    });
                    params[key] = value;
                });
            }
            const merged = { ...(contextoAtual || {}), ...params };
            return await Component(dtl.nome, merged, opts);
        },


        "loadStatic": async () => `<!-- load static -->`,

    "block": async (dtl) => {
            
            // processa internamente o conteúdo do bloco, permitindo includes dentro dele
            if (!dtl.inner) return '';
            const internos = procurarDTLs(dtl.inner);
            
            const processado = await substituirDTLsPorJS(dtl.inner, internos, contextoAtual, opts);
            return processado;

        },

    "static": async (dtl) => `./static/${dtl.nome}`
        ,
        "getStaticPrefix": async () => `./static/`

    };


    // Substituição sequencial (pode otimizar depois para paralelo se quiser)
    for (const dtl of DTLs) {
        
        const handler = substituicoes[dtl.type];
        if (!handler) continue;
        
    const substituicao = await handler(dtl);
        html = html.replace(dtl.original, substituicao);
    
    }


    return html;
}

function substituirVariaveis(html, contexto){
    
    if (!contexto) return html;
    
    // Suporte básico: {{ var }}, {{ var|default:"Texto" }}, {{var|default:'Texto'}}
    const varRegex = /{{\s*([a-zA-Z_][\w]*)\s*(?:\|\s*default:\s*("([^"]*)"|'([^']*)'))?\s*}}/g;
    
    
    return html.replace(varRegex, (full, nome, _grupoDefault, defaultDupla, defaultSimples) => {

        const valorContexto = Object.prototype.hasOwnProperty.call(contexto, nome) ? contexto[nome] : undefined;
        if (valorContexto !== undefined && valorContexto !== null && valorContexto !== '') return valorContexto;
        
        const fallback = defaultDupla || defaultSimples || '';
        
        return fallback;
    });
}




// função para carregar components
export default async function Component(component_escolhido, contexto = {}, opts = {}) {
    // opts: { trackSet?: Set<string>, cacheBust?: string, fetchOptions?: RequestInit }
    const track = opts.trackSet;
    const bust = opts.cacheBust;
    const baseFetchOptions = { cache: 'no-store', ...(opts.fetchOptions || {}) };

    async function trackedFetch(url) {
        try {
            if (track) track.add(url);
            const urlObj = new URL(url, window.location.href);
            if (bust) urlObj.searchParams.set('_v', bust);
            const response = await fetch(urlObj.toString(), baseFetchOptions);
            return response;
        } catch (e) {
            throw e;
        }
    }
    const component_urls = [
        `./templates/${component_escolhido}/index.html`,
        `./templates/ui/${component_escolhido}/index.html`
    ];

    let lastError = null;
    for (const url of component_urls) {
        try {
            if (track) track.add(url);
            const response = await trackedFetch(url);
            
            if (!response.ok) throw new Error(`HTTP ${response.status} em ${url}`);
            
            let data = await response.text();

            // Suporte básico a {% extends 'path/to/template.html' %}
            const extendsRegex = /{%\s*extends\s+['"](.+?)['"]\s*%}/;
            const extMatch = extendsRegex.exec(data);
            if (extMatch) {
                const parentRef = extMatch[1];
                data = data.replace(extMatch[0], '');

                // captura blocks do filho
                const childBlocks = {};
                const childBlockRegex = /{%\s*block\s+([A-Za-z0-9_]+)\s*%}([\s\S]*?){%\s*endblock\s*%}/g;
                let cbm = childBlockRegex.exec(data);
                while (cbm) { childBlocks[cbm[1]] = cbm[2]; cbm = childBlockRegex.exec(data); }

                // carrega parent
                const parentUrls = [
                    `./templates/${parentRef}`,
                    `./templates/ui/${parentRef}`
                ];
                let parentData = null; let pErr = null;
                for (const pu of parentUrls) {
                    try {
                        if (track) track.add(pu);
                        const pr = await trackedFetch(pu);
                        if (!pr.ok) throw new Error(`HTTP ${pr.status} em ${pu}`);
                        parentData = await pr.text();
                        break;
                    } catch (e) { pErr = e; }
                }
                if (!parentData) throw pErr || new Error('Parent não encontrado');

                // substitui blocos do parent pelos overrides
                parentData = parentData.replace(/{%\s*block\s+([A-Za-z0-9_]+)\s*%}([\s\S]*?){%\s*endblock\s*%}/g, (full, nome, inner)=>{
                    return Object.prototype.hasOwnProperty.call(childBlocks, nome) ? childBlocks[nome] : inner;
                });
                data = parentData;
            }

            const encontrados = procurarDTLs(data);
            let htmlProcessado = await substituirDTLsPorJS(data, encontrados, contexto, opts);
            htmlProcessado = substituirVariaveis(htmlProcessado, contexto);
            return htmlProcessado;

        } catch (error) {
            
            lastError = error;
            // tenta próxima URL

        }
    }
    console.error('erro ao encontrar:', lastError);
    return "<span style='color:red;'>Componente não encontrado</span>";
}

// -------- Auto Reload (pure web) --------
async function digestText(text) {
    const enc = new TextEncoder();
    const buf = enc.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-1', buf);
    const bytes = new Uint8Array(hashBuffer);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function fetchTextNoStore(url) {
    const u = new URL(url, window.location.href);
    u.searchParams.set('_poll', Date.now().toString());
    const res = await fetch(u.toString(), { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
    return await res.text();
}

export async function watchComponent(component_escolhido, { contexto = {}, intervalMs = 1000, onRender } = {}) {
    let stopped = false;
    let timer = null;
    let deps = new Map(); // url -> hash

    async function renderAndCollect() {
        const trackSet = new Set();
        const html = await Component(component_escolhido, contexto, { trackSet, cacheBust: Date.now().toString() });
        // compute hashes for tracked urls
        const newDeps = new Map();
        for (const url of trackSet) {
            try {
                const txt = await fetchTextNoStore(url);
                const h = await digestText(txt);
                newDeps.set(url, h);
            } catch (e) {
                console.warn('watchComponent: falha ao carregar para hash', url, e);
            }
        }
        deps = newDeps;
        if (typeof onRender === 'function') onRender(html);
        return html;
    }

    async function pollOnce() {
        for (const [url, oldHash] of deps.entries()) {
            try {
                const txt = await fetchTextNoStore(url);
                const h = await digestText(txt);
                if (h !== oldHash) {
                    // change detected -> re-render and restart polling loop
                    await renderAndCollect();
                    break;
                }
            } catch (e) {
                console.warn('watchComponent: polling falhou', url, e);
            }
        }
    }

    await renderAndCollect();
    timer = setInterval(() => { if (!stopped) pollOnce(); }, intervalMs);

    return {
        stop() { stopped = true; if (timer) clearInterval(timer); },
        isRunning() { return !stopped; }
    };
}