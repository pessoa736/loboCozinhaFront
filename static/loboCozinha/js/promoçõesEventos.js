///errio

if (!static_Base) {
    console.error("static_Base is not defined. Make sure to include static_Base.js before this script.");
}else{
    console.log(static_Base);
}


/// dados por emquanto mokados depois integrar com backend
const lista__ = [
    {
        title:  "Happy hour", 
        description: " Aproveite o melhor do nosso Happy Hour de segunda a quinta! Das 17h às 20h | Drinks e petiscos com preços especiais",
        img: "${static_Base}img/promoçõesEventos/ilustrativos/Rectangle 641 (1).png"
    },

    {
        title:  "50% off", 
        description: " Meio da semana com desconto especial!  De segunda a quinta, das 12h às 14h. Metade do preço em pratos selecionados.",
        img: "{% load static /loboCozinha/img/promoçõesEventos/ilustrativos/Rectangle 641.png %}"
    },

    {
        title: "Quinta do vinho", 
        description: "Toda quinta é dia de brindar! A partir das 17h, vinhos com 50% OFF na taça e na garrafa.",
        img: "{% load static /loboCozinha/img/promoçõesEventos/quintaDoVinho.jpg %}"
    },

    {
        title: "Jantar temático", 
        description: "Uma experiência gastronômica temática, cuidadosamente personalizada de acordo com suas preferências.",
        img: "{% load static /loboCozinha/img/promoçõesEventos/jantarTematico.jpg %}"
    }
]


// isso é uma função sendo criada e executada imediatamente,
// fiz isso para poder cancelar a execução caso o container não seja encontrado, apenas usando return
let __ = (
    
    function (){
    const container = document.querySelector(".promoçõesEventos-container");
    if (!container) {console.error("Container de promoções e eventos não encontrado"); return;}

    const linha1 = document.createElement("div");
    linha1.classList.add("linha1");
    container.appendChild(linha1);

    var item_atual = 0;

    /// primeira fileira
    while(item_atual < 3){
        const card = document.createElement("div");
        card.classList.add("card");
        card.innerHTML = `
            <img src="${lista__[item_atual].img}" alt="${lista__[item_atual].title}">
            <div>
                <h3>${lista__[item_atual].title}</h3>
                <p>${lista__[item_atual].description}</p>
            </div>
        `;
        linha1.appendChild(card);
        item_atual ++;
    }

    ///card unico maior na segunda fileira
    const cardGrande = document.createElement("div");
    cardGrande.classList.add("card-grande");
    cardGrande.innerHTML = `
        <img src="${lista__[item_atual].img}" alt="${lista__[item_atual].title}">
        <div>
            <h3>${lista__[item_atual].title}</h3>
            <p>${lista__[item_atual].description}</p>
        </div>
    `;
    item_atual ++;
    container.appendChild(cardGrande);
})

__();