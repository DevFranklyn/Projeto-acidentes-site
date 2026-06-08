const csvUrl = 'https://raw.githubusercontent.com/DevFranklyn/Projeto-acidentes-2025/refs/heads/main/acidentes_2025_limpo.csv';

function agregarPorHorario(dados) {
    const faixas = ['00-04', '04-08', '08-12', '12-16', '16-20', '20-24'];
    const contagem = [0,0,0,0,0,0];
    dados.forEach(d => {
        if (d.horario) {
            const hora = parseInt(d.horario.split(':')[0]);
            if (hora >=0 && hora<4) contagem[0]++;
            else if (hora>=4 && hora<8) contagem[1]++;
            else if (hora>=8 && hora<12) contagem[2]++;
            else if (hora>=12 && hora<16) contagem[3]++;
            else if (hora>=16 && hora<20) contagem[4]++;
            else if (hora>=20 && hora<=23) contagem[5]++;
        }
    });
    return faixas.map((faixa, idx) => ({ faixa, acidentes: contagem[idx] }));
}

function agregarPorDiaSemana(dados) {
    const ordem = ['segunda-feira','terca-feira','quarta-feira','quinta-feira','sexta-feira','sabado','domingo'];
    const contagem = new Array(7).fill(0);
    dados.forEach(d => {
        if (d.dia_semana) {
            let dia = d.dia_semana.toLowerCase().trim();
            let idx = ordem.findIndex(diaRef => diaRef === dia);
            if (idx !== -1) contagem[idx]++;
        }
    });
    return ordem.map((dia, idx) => ({ dia, acidentes: contagem[idx] }));
}

function agregarTopUF(dados) {
    const mapa = new Map();
    dados.forEach(d => {
        if (d.uf) mapa.set(d.uf, (mapa.get(d.uf) || 0) + 1);
    });
    return Array.from(mapa, ([uf, total]) => ({ uf, total })).sort((a,b) => b.total - a.total).slice(0,10);
}

function agregarCausas(dados) {
    const mapa = new Map();
    dados.forEach(d => {
        let causa = d.causa_acidente;
        if (causa && causa !== '') mapa.set(causa, (mapa.get(causa) || 0) + 1);
    });
    return Array.from(mapa, ([causa, total]) => ({ causa, total })).sort((a,b) => b.total - a.total).slice(0,10);
}

function agregarClassificacao(dados) {
    const mapa = new Map();
    dados.forEach(d => {
        const cls = d.classificacao_acidente;
        if (cls && cls !== '') mapa.set(cls, (mapa.get(cls) || 0) + 1);
    });
    return Array.from(mapa, ([categoria, acidentes]) => ({ categoria, acidentes })).sort((a,b) => b.acidentes - a.acidentes);
}

function agregarTopBR(dados) {
    const mapa = new Map();
    dados.forEach(d => {
        const br = d.br;
        if (br && br.toString().trim() !== '') {
            const brLimpo = br.toString().trim().toUpperCase();
            mapa.set(brLimpo, (mapa.get(brLimpo) || 0) + 1);
        }
    });
    return Array.from(mapa, ([br, total]) => ({ br, total })).sort((a,b) => b.total - a.total).slice(0,10);
}

function agregarSexo(dados) {
    const mapa = new Map();
    dados.forEach(d => {
        let sexo = d.sexo;
        if (sexo && sexo !== '') {
            if (sexo.toUpperCase() === 'M') sexo = 'Masculino';
            else if (sexo.toUpperCase() === 'F') sexo = 'Feminino';
            mapa.set(sexo, (mapa.get(sexo) || 0) + 1);
        }
    });
    return Array.from(mapa, ([sexo, total]) => ({ sexo, total }));
}

function agregarTopTipoAcidente(dados) {
    const mapa = new Map();
    dados.forEach(d => {
        const tipo = d.tipo_acidente;
        if (tipo && tipo !== '') mapa.set(tipo, (mapa.get(tipo) || 0) + 1);
    });
    return Array.from(mapa, ([tipo, total]) => ({ tipo, total })).sort((a,b) => b.total - a.total).slice(0,10);
}

function agregarIdade(dados) {
    const faixas = ['0-17','18-25','26-35','36-50','51-65','65+'];
    const limites = [0,18,26,36,51,66,200];
    const contagem = new Array(faixas.length).fill(0);
    dados.forEach(d => {
        const idade = d.idade;
        if (idade && typeof idade === 'number' && idade > 0) {
            for (let i=0; i<limites.length-1; i++) {
                if (idade >= limites[i] && idade < limites[i+1]) {
                    contagem[i]++;
                    break;
                }
            }
        }
    });
    return faixas.map((faixa, idx) => ({ faixa, acidentes: contagem[idx] }));
}

async function renderGrafico(elementId, spec, insightText) {
    try {
        await vegaEmbed(`#${elementId}`, spec, { actions: false });
        const svg = document.querySelector(`#${elementId} svg`);
        if (svg) svg.setAttribute('aria-label', insightText);
    } catch (err) {
        console.error(`Erro no grafico ${elementId}:`, err);
        document.getElementById(elementId).innerHTML = '<div style="color:red;">Erro ao renderizar grafico.</div>';
    }
}

d3.csv(csvUrl, d3.autoType).then(data => {
    if (!data || data.length === 0) throw new Error('CSV vazio ou nao encontrado');
    console.log(`Dados carregados: ${data.length} registros`);

    const dadosHorario = agregarPorHorario(data);
    const dadosDiaSemana = agregarPorDiaSemana(data);
    const dadosUF = agregarTopUF(data);
    const dadosCausas = agregarCausas(data);
    const dadosClassif = agregarClassificacao(data);
    const dadosBR = agregarTopBR(data);
    const dadosSexo = agregarSexo(data);
    const dadosTipo = agregarTopTipoAcidente(data);
    const dadosIdade = agregarIdade(data);

    const container = document.getElementById('graficos-container');
    if (!container) return;
    container.innerHTML = '';

    const specs = [
        { id: 'graf1', titulo: '1. Acidentes por Horario', dados: dadosHorario, encoding: { y: { field: 'faixa', type: 'nominal', sort: ['00-04','04-08','08-12','12-16','16-20','20-24'] }, x: { field: 'acidentes', type: 'quantitative' } }, cor: '#e63946', insight: 'Picos entre 8h-12h e 16h-20h, horarios de maior fluxo.' },
        { id: 'graf2', titulo: '2. Acidentes por Dia da Semana', dados: dadosDiaSemana, encoding: { x: { field: 'dia', type: 'nominal', sort: ['segunda-feira','terca-feira','quarta-feira','quinta-feira','sexta-feira','sabado','domingo'] }, y: { field: 'acidentes', type: 'quantitative' } }, cor: '#457b9d', insight: 'Finais de semana concentram mais acidentes, possivelmente devido a viagens de lazer.' },
        { id: 'graf3', titulo: '3. Top 10 Estados com Mais Acidentes', dados: dadosUF, encoding: { y: { field: 'uf', type: 'nominal', sort: '-x' }, x: { field: 'total', type: 'quantitative' } }, cor: '#e76f51', insight: 'Minas Gerais, Sao Paulo e Parana lideram, refletindo maior extensao de rodovias.' },
        { id: 'graf4', titulo: '4. Principais Causas de Acidente', dados: dadosCausas, encoding: { y: { field: 'causa', type: 'nominal', sort: '-x' }, x: { field: 'total', type: 'quantitative' } }, cor: '#2a9d8f', insight: 'Falta de atencao, velocidade incompativel e desobediencia as normas sao as causas mais recorrentes.' },
        { id: 'graf5', titulo: '5. Acidentes por Classificacao', dados: dadosClassif, encoding: { y: { field: 'categoria', type: 'nominal', sort: '-x' }, x: { field: 'acidentes', type: 'quantitative' } }, cor: '#2a9d8f', insight: 'Acidentes com vitimas leves predominam, mas graves e fatais sao relevantes.' },
        { id: 'graf6', titulo: '6. Top 10 Rodovias com Mais Acidentes', dados: dadosBR, encoding: { y: { field: 'br', type: 'nominal', sort: '-x' }, x: { field: 'total', type: 'quantitative' } }, cor: '#f4a261', insight: 'Rodovias mais movimentadas apresentam maiores indices de acidentes.' },
        { id: 'graf7', titulo: '7. Acidentes por Sexo das Vitimas', dados: dadosSexo, encoding: { y: { field: 'sexo', type: 'nominal' }, x: { field: 'total', type: 'quantitative' } }, cor: '#6d597a', insight: 'Homens representam a grande maioria das vitimas (aproximadamente 75%).' },
        { id: 'graf8', titulo: '8. Top 10 Tipos de Acidente', dados: dadosTipo, encoding: { y: { field: 'tipo', type: 'nominal', sort: '-x' }, x: { field: 'total', type: 'quantitative' } }, cor: '#e9c46a', insight: 'Colisoes traseiras e transversais, alem de capotamentos, predominam.' },
        { id: 'graf9', titulo: '9. Acidentes por Faixa Etaria', dados: dadosIdade, encoding: { y: { field: 'faixa', type: 'nominal', sort: ['0-17','18-25','26-35','36-50','51-65','65+'] }, x: { field: 'acidentes', type: 'quantitative' } }, cor: '#e76f51', insight: 'Adultos entre 30 e 59 anos sao os mais envolvidos em acidentes.' }
    ];

    specs.forEach(specItem => {
        const card = document.createElement('div');
        card.className = 'chart-card';
        card.innerHTML = `<h2>${specItem.titulo}</h2><div id="${specItem.id}" class="chart-container"></div><div class="insight">${specItem.insight}</div>`;
        container.appendChild(card);

        const spec = {
            data: { values: specItem.dados },
            mark: { type: 'bar', cornerRadiusTopRight: 6, cornerRadiusBottomRight: 6, color: specItem.cor },
            encoding: specItem.encoding,
            width: 'container',
            height: 400,
            autosize: { type: 'fit', contains: 'padding' }
        };
        renderGrafico(specItem.id, spec, specItem.insight);
    });
}).catch(err => {
    console.error(err);
    const container = document.getElementById('graficos-container');
    if (container) {
        container.innerHTML = `<div style="background:#ffe6e6; padding:20px; border-radius:16px; color:#a00;">
            Erro ao carregar dados: ${err.message}<br>
            <button id="reload-btn" style="margin-top:10px; padding:8px 16px; background:#003366; color:white; border:none; border-radius:8px; cursor:pointer;">Tentar novamente</button>
        </div>`;
        const reloadBtn = document.getElementById('reload-btn');
        if (reloadBtn) reloadBtn.onclick = () => location.reload();
    }
});

(function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';
    if (isDark) document.body.classList.add('dark');
    const btn = document.getElementById('theme-switch');
    if (!btn) return;
    const lightIcon = btn.querySelector('.light-icon');
    const darkIcon = btn.querySelector('.dark-icon');
    function updateIcons(theme) {
        if (theme === 'dark') {
            lightIcon.style.display = 'none';
            darkIcon.style.display = 'inline';
        } else {
            lightIcon.style.display = 'inline';
            darkIcon.style.display = 'none';
        }
    }
    updateIcons(isDark ? 'dark' : 'light');
    btn.addEventListener('click', () => {
        const isNowDark = document.body.classList.toggle('dark');
        localStorage.setItem('theme', isNowDark ? 'dark' : 'light');
        updateIcons(isNowDark ? 'dark' : 'light');
    });
})();
