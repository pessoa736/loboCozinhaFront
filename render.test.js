

function procurarDTLs(html) {


    // expressões regulares para encontrar os DTLs
    const [include, loadStatic, block, staticTag] = [
        [/{%\s*include\s*['"](?:\.\/)?(.+?)\/index\.html['"]\s*%}/g, "include"],
        [/{%\s*load\s+static\s*%}/g, "loadStatic"],
        [/{%\s*block\s+([A-Za-z0-9_]+)\s*%}[\s\S]*?{%\s*endblock\s*%}/g, "block"],
        [/{%\s*static\s*['"](?!https?:\/\/)(?:\.\/)?(.+?)['"]\s*%}/g, "static"]
    ];

    
    let resultados = [];
    
    
    
    // procura por cada DTL e armazena os resultados
    [include, loadStatic, block, staticTag].forEach((r)=>{
        
        let regex = r[0];
        let match = regex.exec(html);

        
        while (match !== null) {
            
            resultados.push({
                nome: match[1],
                type: r[1],
                posicao: match.index,
                original: match[0],         
            });
            
            // continua procurando
            match = regex.exec(html);
        }
    });
    

    return resultados;
}





async function substituirDTLsPorJS(html, DTLs){

    // funções de substituição para cada DTL
    const substituicoes = {
        "include": async (nome) => await Component(nome),
        "loadStatic": async () => `<!-- load static -->`,
        "block": async (nome) => `<!-- bloco ${nome} -->`,
        "static": async (nome) => `./static/${nome}`
    };



    // substitui em série aguardando cada include/block
    for (const dtl of DTLs) {
        const substituicao = await substituicoes[dtl.type](dtl.nome);
        html = html.replace(dtl.original, substituicao);
    }

    return html;
}





// função para carregar components
export default async function Component(component_escolhido, filhos) {
    const component_urls = [
        `./templates/${component_escolhido}/index.html`,
        `./templates/ui/${component_escolhido}/index.html`
    ];

    let lastError = null;

    try {
        for (const url of component_urls) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status} em ${url}`);
                let data = await response.text();
                const encontrados = procurarDTLs(data);
                const htmlProcessado = await substituirDTLsPorJS(data, encontrados);
                return htmlProcessado; // sucesso: retorna na primeira que funcionar
            } catch (error) {
                lastError = error;
                // tenta próxima URL
            }
        }

        // se nenhuma URL funcionou
        throw new Error('Componente não encontrado');
        
    } catch (error) {
        console.error('erro ao encontrar:', lastError ?? error);
        return "<span style='color:red;'>Componente não encontrado</span>";
    }
}
