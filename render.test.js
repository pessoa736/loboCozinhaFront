

function procurarDTLs(html) {
    
    // Regexes para encontrar DTLs básicos + include com parâmetros opcionais
    // include agora suporta: {% include 'ui/button/index.html' with text='Reservar' outro="X" %}
    const include = [/{%\s*include\s*['"](?:\.\/)?(.+?)\/index\.html['"](?:\s+with\s+([^%]+?))?\s*%}/g, "include"]; // group1 = caminho, group2 = params
    const loadStatic = [/{%\s*load\s+static\s*%}/g, "loadStatic"]; 
    
    
    // block: captura nome e conteúdo interno (group2)
    const block = [/{%\s*block\s+([A-Za-z0-9_]+)\s*%}([\s\S]*?){%\s*endblock\s*%}/g, "block"]; 
    const staticTag = [/{%\s*static\s*['"](?!https?:\/\/)(?:\.\/)?(.+?)['"]\s*%}/g, "static"]; 

    

    let resultados = [];

    
    
    [include, loadStatic, block, staticTag].forEach((r)=>{
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





async function substituirDTLsPorJS(html, DTLs, contextoAtual){
    
    
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
            return await Component(dtl.nome, merged);
        },


        "loadStatic": async () => `<!-- load static -->`,

        "block": async (dtl) => {
            
            // processa internamente o conteúdo do bloco, permitindo includes dentro dele
            if (!dtl.inner) return '';
            const internos = procurarDTLs(dtl.inner);
            
            const processado = await substituirDTLsPorJS(dtl.inner, internos, contextoAtual);
            return processado;

        },

        "static": async (dtl) => `./static/${dtl.nome}`

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
export default async function Component(component_escolhido, contexto = {}) {
    const component_urls = [
        `./templates/${component_escolhido}/index.html`,
        `./templates/ui/${component_escolhido}/index.html`
    ];

    let lastError = null;
    for (const url of component_urls) {
        try {
            
            const response = await fetch(url);
            
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
                    try { const pr = await fetch(pu); if (!pr.ok) throw new Error(`HTTP ${pr.status} em ${pu}`); parentData = await pr.text(); break; } catch (e) { pErr = e; }
                }
                if (!parentData) throw pErr || new Error('Parent não encontrado');

                // substitui blocos do parent pelos overrides
                parentData = parentData.replace(/{%\s*block\s+([A-Za-z0-9_]+)\s*%}([\s\S]*?){%\s*endblock\s*%}/g, (full, nome, inner)=>{
                    return Object.prototype.hasOwnProperty.call(childBlocks, nome) ? childBlocks[nome] : inner;
                });
                data = parentData;
            }

            const encontrados = procurarDTLs(data);
            let htmlProcessado = await substituirDTLsPorJS(data, encontrados, contexto);
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
