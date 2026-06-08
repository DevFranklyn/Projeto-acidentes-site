<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard de Acidentes 2025</title>
    
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>

    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f9;
            margin: 0;
            padding: 20px;
        }
        #graficos-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: center;
        }
        .chart-card {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            padding: 20px;
            max-width: 700px;
            width: 100%;
        }
        .chart-card h2 {
            font-size: 1.2rem;
            color: #333;
            text-align: center;
            margin-top: 0;
        }
        .chart-container {
            display: flex;
            justify-content: center;
        }
        .insight {
            background: #eef2f5;
            padding: 10px;
            border-radius: 6px;
            margin-top: 15px;
            font-size: 0.9rem;
            color: #555;
        }
    </style>
</head>
<body>

    <div id="graficos-container">Carregando dados...</div>

    <script>
        const csvUrl = 'https://raw.githubusercontent.com/DevFranklyn/Projeto-acidentes-2025/refs/heads/main/acidentes_2025_limpo.csv';

        function agregarPorHorario(dados) {
            const faixas = ['00-04', '04-08', '08-12', '12-16', '16-20', '20-24'];
            const contagem = [0, 0, 0, 0, 0, 0];
            dados.forEach(d => {
                if (d.horario) {
                    const hora = parseInt(d.horario.split(':')[0]);
                    if (hora >= 0 && hora < 4) contagem[0]++;
                    else if (hora >= 4 && hora < 8) contagem[1]++;
                    else if (hora >= 8 && hora < 12) contagem[2]++;
                    else if (hora >= 12 && hora < 16) contagem[3]++;
                    else if (hora >= 16 && hora < 20) contagem[4]++;
                    else if (hora >= 20 && hora <= 23) contagem[5]++;
                }
            });
            return faixas.map((faixa, idx) => ({ faixa, acidentes: contagem[idx] }));
        }

        function agregarPorDiaSemana(dados) {
            const ordem = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo'];
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
                if (d.uf) {
                    mapa.set(d.uf, (mapa.get(d.uf) || 0) + 1);
                }
            });
            return Array.from(mapa, ([uf, total]) => ({ uf, total }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 10);
        }

        function agregarCausas(dados) {
            const mapa = new Map();
            dados.forEach(d => {
                let causa = d.causa_acidente;
                if (causa && causa !== '') {
                    mapa.set(causa, (mapa.get(causa) || 0) + 1);
                }
            });
            return Array.from(mapa, ([causa, total]) => ({ causa, total }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 10);
        }

        function agregarClassificacao(dados) {
            const mapa = new Map();
            dados.forEach(d => {
                const cls = d.classificacao_acidente;
                if (cls && cls !== '') {
                    mapa.set(cls, (mapa.get(cls) || 0) + 1);
                }
            });
            return Array.from(mapa, ([categoria, acidentes]) => ({ categoria, acidentes }))
                .sort((a, b) => b.acidentes - a.acidentes);
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
            return Array.from(mapa, ([br, total]) => ({ br, total }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 10);
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
                if (tipo && tipo !== '') {
                    mapa.set(tipo, (mapa.get(tipo) || 0) + 1);
                }
            });
            return Array.from(mapa, ([tipo, total]) => ({ tipo, total }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 10);
        }

        function agregarIdade(dados) {
            const faixas = ['0-17', '18-25', '26-35', '36-50', '51-65', '65+'];
            const limites = [0, 18, 26, 36, 51, 66, 200];
            const contagem = new Array(faixas.length).fill(0);
            dados.forEach(d => {
                const idade = d.idade;
                if (idade && typeof idade === 'number' && idade > 0) {
                    for (let i = 0; i < limites.length - 1; i++) {
                        if (idade >= limites[i] && idade < limites[i + 1]) {
                            contagem[i]++;
                            break;
                        }
                    }
                }
            });
            return faixas.map((faixa, idx) => ({ faixa, acidentes: contagem[idx] }));
        }

        async function renderGrafico(elementId, spec) {
            try {
                await vegaEmbed(`#${elementId}`, spec, { actions: false });
            } catch (err) {
                console.error(`Erro no gráfico ${elementId}:`, err);
                document.getElementById(elementId).innerHTML = `<div style="color:red;">Erro ao renderizar gráfico.</div>`;
            }
        }

        d3.csv(csvUrl, d3.autoType).then(data => {
            if (!data || data.length === 0) throw new Error('CSV vazio ou não encontrado');
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
            container.innerHTML = ''; // Limpa o "Carregando dados..."

            const specs = [
                { id: 'graf1', titulo: '1. Acidentes por Horário', dados: dadosHorario, encoding: { y: { field: 'faixa', type: 'nominal', sort: ['00-04', '04-08', '08-12', '12-16', '16-20', '20-24'] }, x: { field: 'acidentes', type: 'quantitative' } }, cor: '#e63946', insight: 'Picos entre 8h-12h e 16h-20h, horários de maior fluxo.' },
                { id: 'graf2', titulo: '2. Acidentes por Dia da Semana', dados: dadosDiaSemana, encoding: { x: { field: 'dia', type: 'nominal', sort: ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo'] }, y: { field: 'acidentes', type: 'quantitative' } }, cor: '#457b9d', insight: 'Finais de semana concentram mais acidentes, possivelmente devido a viagens de lazer.' },
                { id: 'graf3', titulo: '3. Top 10 Estados com Mais Acidentes', dados: dadosUF, encoding: { y: { field: 'uf', type: 'nominal', sort: '-x' }, x: { field: 'total', type: 'quantitative' } }, cor: '#e76f51', insight: 'Minas Gerais, São Paulo e Paraná lideram, refletindo maior extensão de rodovias.' },
                { id: 'graf4', titulo: '4. Principais Causas de Acidente', dados: dadosCausas, encoding: { y: { field: 'causa', type: 'nominal', sort: '-x' }, x: { field: 'total', type: 'quantitative' } }, cor: '#2a9d8f', insight: 'Falta de atenção, velocidade incompatível e desobediência às normas são as causas mais recorrentes.' },
                { id: 'graf5', titulo: '5. Acidentes por Classificação', dados: dadosClassif, encoding: { y: { field: 'categoria', type: 'nominal', sort: '-x' }, x: { field: 'acidentes', type: 'quantitative' } }, cor: '#2a9d8f', insight: 'Acidentes com vítimas leves predominam, mas graves e fatais são relevantes.' },
                { id: 'graf6', titulo: '6. Top 10 Rodovias com Mais Acidentes', dados: dadosBR, encoding: { y: { field: 'br', type: 'nominal', sort: '-x' }, x: { field: 'total', type: 'quantitative' } }, cor: '#f4a261', insight: 'Rodovias mais movimentadas apresentam maiores índices de acidentes.' },
                { id: 'graf7', titulo: '7. Acidentes por Sexo das Vítimas', dados: dadosSexo, encoding: { y: { field: 'sexo', type: 'nominal' }, x: { field: 'total', type: 'quantitative' } }, cor: '#6d597a', insight: 'Homens representam a grande maioria das vítimas (≈75%).' },
                { id: 'graf8', titulo: '8. Top 10 Tipos de Acidente', dados: dadosTipo, encoding: { y: { field: 'tipo', type: 'nominal', sort: '-x' }, x: { field: 'total', type: 'quantitative' } }, cor: '#e9c46a', insight: 'Colisões traseiras e transversais, além de capotamentos, predominam.' },
                { id: 'graf9', titulo: '9. Acidentes por Faixa Etária', dados: dadosIdade, encoding: { y: { field: 'faixa', type: 'nominal', sort: ['0-17', '18-25', '26-35', '36-50', '51-65', '65+'] }, x: { field: 'acidentes', type: 'quantitative' } }, cor: '#e76f51', insight: 'Adultos entre 30 e 59 anos são os mais envolvidos em acidentes.' }
            ];

            specs.forEach(specItem => {
                const card = document.createElement('div');
                card.className = 'chart-card';
                card.innerHTML = `<h2>${specItem.titulo}</h2><div id="${specItem.id}" class="chart-container"></div><div class="insight">📌 ${specItem.insight}</div>`;
                container.appendChild(card);

                const spec = {
                    data: { values: specItem.dados },
                    mark: { type: 'bar', cornerRadiusTopRight: 6, cornerRadiusBottomRight: 6, color: specItem.cor },
                    encoding: specItem.encoding,
                    width: 600,
                    height: 350
                };
                renderGrafico(specItem.id, spec);
            });
        }).catch(err => {
            console.error(err);
            const container = document.getElementById('graficos-container');
            if (container) {
                container.innerHTML = `<div style="background:#ffe6e6; padding:20px; border-radius:16px; color:#a00;">❌ Erro ao carregar dados: ${err.message}<br>Verifique se o arquivo CSV está no mesmo diretório ou acessível publicamente.</div>`;
            }
        });
    </script>
</body>
</html>
