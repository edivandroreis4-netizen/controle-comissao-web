const TAXA_COMISSAO = 0.02;
const CHAVE_LOCAL_STORAGE = "vendasComissao";
const CHAVE_META_ATINGIDA = "ultimaMetaAtingida";
const CHAVE_TEMA = "temaControleComissao";
const METAS = [
  { valor: 200000, bonus: 400 },
  { valor: 250000, bonus: 600 },
  { valor: 300000, bonus: 800 },
  { valor: 350000, bonus: 1000 }
];

const bibliotecaZodDisponivel = typeof Zod !== "undefined";
const bibliotecaDayjsDisponivel = typeof dayjs !== "undefined";

if (bibliotecaDayjsDisponivel) {
  dayjs.locale("pt-br");
}

function dataIsoValida(data) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;

  if (bibliotecaDayjsDisponivel) {
    const dataConvertida = dayjs(data);
    return dataConvertida.isValid() && dataConvertida.format("YYYY-MM-DD") === data;
  }

  const dataConvertida = new Date(`${data}T00:00:00`);
  return !Number.isNaN(dataConvertida.getTime());
}

const schemaVenda = bibliotecaZodDisponivel
  ? Zod.object({
      valor: Zod.number({ invalid_type_error: "Informe um valor numérico." })
        .finite("Informe um valor válido.")
        .positive("Digite um valor de venda maior que zero.")
        .max(999999999.99, "O valor informado ultrapassa o limite permitido."),
      data: Zod.string()
        .min(1, "Selecione a data da venda.")
        .refine(dataIsoValida, "Informe uma data válida."),
      cliente: Zod.string()
        .trim()
        .max(80, "O nome do cliente pode ter no máximo 80 caracteres.")
    })
  : null;

const formulario = document.querySelector("#form-venda");
const campoValorVenda = document.querySelector("#valor-venda");
const campoDataVenda = document.querySelector("#data-venda");
const campoCliente = document.querySelector("#cliente");
const mensagem = document.querySelector("#mensagem");
const listaVendas = document.querySelector("#lista-vendas");
const avisoSemVendas = document.querySelector("#sem-vendas");
const totalVendasElemento = document.querySelector("#total-vendas");
const totalComissaoElemento = document.querySelector("#total-comissao");
const quantidadeVendasElemento = document.querySelector("#quantidade-vendas");
const filtroMes = document.querySelector("#filtro-mes");
const filtroAno = document.querySelector("#filtro-ano");
const botaoLimparFiltros = document.querySelector("#botao-limpar-filtros");
const botaoApagarTudo = document.querySelector("#botao-apagar-tudo");
const dataAtualElemento = document.querySelector("#data-atual");
const insightMelhorVenda = document.querySelector("#insight-melhor-venda");
const insightMelhorVendaTexto = document.querySelector("#insight-melhor-venda-texto");
const insightComissao = document.querySelector("#insight-comissao");
const insightTicketMedio = document.querySelector("#insight-ticket-medio");
const insightMelhorDia = document.querySelector("#insight-melhor-dia");
const insightMelhorDiaTexto = document.querySelector("#insight-melhor-dia-texto");
const metaProximaValor = document.querySelector("#meta-proxima-valor");
const metaProximaBonus = document.querySelector("#meta-proxima-bonus");
const metaPercentual = document.querySelector("#meta-percentual");
const barraMetaPreenchimento = document.querySelector("#barra-meta-preenchimento");
const metaTotalAtual = document.querySelector("#meta-total-atual");
const metaFaltante = document.querySelector("#meta-faltante");
const metaMensagem = document.querySelector("#meta-mensagem");
const listaMetas = document.querySelector("#lista-metas");
const cardMetaProgresso = document.querySelector("#card-meta-progresso");
const metaCelebracao = document.querySelector("#meta-celebracao");
const sidebarMetaValor = document.querySelector("#sidebar-meta-valor");
const sidebarMetaFaltam = document.querySelector("#sidebar-meta-faltam");
const graficoVendasCanvas = document.querySelector("#grafico-vendas");
const graficoStatus = document.querySelector("#grafico-status");
const botaoInstalar = document.querySelector("#botao-instalar");
const botaoExportarCsv = document.querySelector("#botao-exportar-csv");
const botaoTema = document.querySelector("#botao-tema");
const iconeTema = document.querySelector("#icone-tema");
const textoTema = document.querySelector("#texto-tema");
const metaThemeColor = document.querySelector('meta[name="theme-color"]');

let vendas = carregarVendas();
let carrosselInsights;
let graficoVendas;
let eventoInstalacaoPwa;

function carregarVendas() {
  const vendasSalvas = localStorage.getItem(CHAVE_LOCAL_STORAGE);
  if (!vendasSalvas) return [];
  try {
    const dados = JSON.parse(vendasSalvas);
    return Array.isArray(dados) ? dados : [];
  } catch (erro) {
    console.error("Erro ao carregar as vendas:", erro);
    return [];
  }
}

function salvarVendas() {
  localStorage.setItem(CHAVE_LOCAL_STORAGE, JSON.stringify(vendas));
}

function formatarMoeda(valor = 0) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "R$ 0,00";
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarData(data) {
  if (bibliotecaDayjsDisponivel && dataIsoValida(data)) {
    return dayjs(data).format("DD/MM/YYYY");
  }

  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function calcularComissao(valorVenda) {
  return valorVenda * TAXA_COMISSAO;
}

function definirDatasIniciais() {
  if (bibliotecaDayjsDisponivel) {
    const hoje = dayjs();
    campoDataVenda.value = hoje.format("YYYY-MM-DD");
    filtroAno.value = hoje.format("YYYY");
    filtroMes.value = String(hoje.month());

    const dataPorExtenso = hoje.format("dddd, DD [de] MMMM [de] YYYY");
    dataAtualElemento.textContent = dataPorExtenso.charAt(0).toUpperCase() + dataPorExtenso.slice(1);
    return;
  }

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  campoDataVenda.value = `${ano}-${mes}-${dia}`;
  filtroAno.value = ano;
  filtroMes.value = String(hoje.getMonth());
  dataAtualElemento.textContent = hoje.toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric"
  });
}

function iniciarCarrossel() {
  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  carrosselInsights = new Splide("#carrossel-insights", {
    type: "slide",
    perPage: 3,
    perMove: 1,
    gap: "1rem",
    pagination: true,
    arrows: true,
    drag: true,
    keyboard: "focused",
    speed: reduzirMovimento ? 0 : 450,
    breakpoints: {
      1100: { perPage: 2 },
      700: { perPage: 1 }
    },
    i18n: {
      prev: "Voltar para o insight anterior",
      next: "Avançar para o próximo insight",
      first: "Ir para o primeiro insight",
      last: "Ir para o último insight",
      slideX: "Ir para o insight %s",
      pageX: "Ir para a página %s",
      carousel: "Carrossel de insights"
    }
  });
  carrosselInsights.mount();
  const setas = document.querySelector("#carrossel-insights .splide__arrows");
  if (setas) {
    document.querySelector("#insights-setas").appendChild(setas);
  }
}

function exibirToast(titulo, icone = "success") {
  if (typeof Swal === "undefined") {
    mostrarMensagem(titulo, icone === "error" ? "erro" : "sucesso");
    return;
  }

  Swal.fire({
    toast: true,
    position: "top-end",
    icon: icone,
    title: titulo,
    showConfirmButton: false,
    timer: 2800,
    timerProgressBar: true
  });
}

function exibirAlertaErro(titulo, texto) {
  if (typeof Swal === "undefined") {
    mostrarMensagem(texto, "erro");
    return;
  }

  Swal.fire({
    icon: "error",
    title: titulo,
    text: texto,
    confirmButtonText: "Entendi"
  });
}

function agruparVendasPorDia(vendasExibidas) {
  const totais = vendasExibidas.reduce((resultado, venda) => {
    resultado[venda.data] = (resultado[venda.data] || 0) + venda.valor;
    return resultado;
  }, {});

  return Object.entries(totais)
    .sort(([dataA], [dataB]) => dataA.localeCompare(dataB))
    .map(([data, total]) => ({ data, total }));
}

function atualizarGrafico(vendasExibidas) {
  if (!graficoVendasCanvas || typeof Chart === "undefined") {
    if (graficoStatus) graficoStatus.textContent = "Gráfico indisponível no momento.";
    return;
  }

  const vendasPorDia = agruparVendasPorDia(vendasExibidas);
  const rotulos = vendasPorDia.map((item) => formatarData(item.data));
  const valores = vendasPorDia.map((item) => item.total);

  if (graficoVendas) {
    graficoVendas.destroy();
  }

  graficoStatus.textContent = vendasPorDia.length
    ? `${vendasPorDia.length} dia(s) com vendas`
    : "Nenhuma venda no período";

  graficoVendas = new Chart(graficoVendasCanvas, {
    type: "bar",
    data: {
      labels: rotulos,
      datasets: [{
        label: "Total vendido",
        data: valores,
        backgroundColor: "rgba(23, 49, 109, 0.78)",
        borderColor: "#17316d",
        borderWidth: 1,
        borderRadius: 8,
        maxBarThickness: 56
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(contexto) {
              return `Total: ${formatarMoeda(contexto.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback(valor) {
              return new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                notation: "compact",
                maximumFractionDigits: 1
              }).format(valor);
            }
          }
        }
      }
    }
  });
}

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
  window.setTimeout(() => {
    mensagem.textContent = "";
    mensagem.className = "mensagem";
  }, 4000);
}

function obterVendasFiltradas() {
  const mesSelecionado = filtroMes.value;
  const anoSelecionado = filtroAno.value.trim();
  return vendas.filter((venda) => {
    const [ano, mes] = venda.data.split("-");
    const correspondeAoMes = mesSelecionado === "todos" || Number(mes) - 1 === Number(mesSelecionado);
    const correspondeAoAno = anoSelecionado === "" || Number(ano) === Number(anoSelecionado);
    return correspondeAoMes && correspondeAoAno;
  });
}

function calcularMelhorDia(vendasExibidas) {
  const totaisPorDia = vendasExibidas.reduce((resultado, venda) => {
    resultado[venda.data] = (resultado[venda.data] || 0) + venda.valor;
    return resultado;
  }, {});
  const dias = Object.entries(totaisPorDia);
  if (dias.length === 0) return null;
  const [data, total] = dias.reduce((melhor, atual) => atual[1] > melhor[1] ? atual : melhor);
  return { data, total };
}

function atualizarInsights(vendasExibidas, totalVendido, totalComissao) {
  if (vendasExibidas.length === 0) {
    insightMelhorVenda.textContent = formatarMoeda(0);
    insightMelhorVendaTexto.textContent = "Registre uma venda para gerar este indicador.";
    insightComissao.textContent = formatarMoeda(0);
    insightTicketMedio.textContent = formatarMoeda(0);
    insightMelhorDia.textContent = "Sem dados";
    insightMelhorDiaTexto.textContent = "O sistema identificará o dia com maior total vendido.";
    return;
  }
  const melhorVenda = vendasExibidas.reduce((maior, venda) => venda.valor > maior.valor ? venda : maior);
  const ticketMedio = totalVendido / vendasExibidas.length;
  const melhorDia = calcularMelhorDia(vendasExibidas);
  insightMelhorVenda.textContent = formatarMoeda(melhorVenda.valor);
  insightMelhorVendaTexto.textContent = `Registrada em ${formatarData(melhorVenda.data)}${melhorVenda.cliente ? ` para ${melhorVenda.cliente}` : ""}.`;
  insightComissao.textContent = formatarMoeda(totalComissao);
  insightTicketMedio.textContent = formatarMoeda(ticketMedio);
  insightMelhorDia.textContent = formatarData(melhorDia.data);
  insightMelhorDiaTexto.textContent = `${formatarMoeda(melhorDia.total)} em vendas nesse dia.`;
}

function obterMaiorMetaAtingida(totalVendido) {
  return METAS.filter((meta) => totalVendido >= meta.valor).at(-1) || null;
}

function renderizarListaMetas(totalVendido) {
  listaMetas.replaceChildren();
  const proximaMeta = METAS.find((meta) => totalVendido < meta.valor) || null;
  METAS.forEach((meta) => {
    const item = document.createElement("li");
    item.className = "meta-item";
    const atingida = totalVendido >= meta.valor;
    if (atingida) item.classList.add("meta-item--atingida");
    if (proximaMeta && meta.valor === proximaMeta.valor) item.classList.add("meta-item--proxima");

    const titulo = document.createElement("div");
    titulo.innerHTML = `<div class="meta-item__titulo">${formatarMoeda(meta.valor)}</div><div class="meta-item__bonus">Bônus: ${formatarMoeda(meta.bonus)}</div>`;

    const status = document.createElement("span");
    status.className = "meta-item__status";
    if (atingida) {
      status.textContent = "Meta batida";
    } else if (proximaMeta && meta.valor === proximaMeta.valor) {
      status.textContent = "Próxima meta";
    } else {
      status.textContent = "Aguardando";
    }

    item.append(titulo, status);
    listaMetas.appendChild(item);
  });
}

function celebrarMeta(meta) {
  if (!meta) return;

  if (typeof Swal !== "undefined") {
    Swal.fire({
      icon: "success",
      title: "Meta atingida!",
      html: `Você alcançou <strong>${formatarMoeda(meta.valor)}</strong> em vendas e conquistou um bônus estimado de <strong>${formatarMoeda(meta.bonus)}</strong>.`,
      confirmButtonText: "Continuar"
    });
  }

  metaCelebracao.textContent = `Meta batida! Bônus estimado: ${formatarMoeda(meta.bonus)}.`;
  metaCelebracao.classList.add("meta-celebracao--ativo");
  cardMetaProgresso.classList.add("card-meta--celebrando");
  window.setTimeout(() => {
    metaCelebracao.classList.remove("meta-celebracao--ativo");
    cardMetaProgresso.classList.remove("card-meta--celebrando");
  }, 2600);
}

function atualizarMetas(totalVendido, dispararCelebracao = false) {
  const proximaMeta = METAS.find((meta) => totalVendido < meta.valor) || null;
  const maiorMetaAtingida = obterMaiorMetaAtingida(totalVendido);
  const ultimaMetaAtingida = Number(localStorage.getItem(CHAVE_META_ATINGIDA) || 0);

  renderizarListaMetas(totalVendido);
  metaTotalAtual.textContent = formatarMoeda(totalVendido);

  if (proximaMeta) {
    const percentual = Math.min((totalVendido / proximaMeta.valor) * 100, 100);
    const faltante = Math.max(proximaMeta.valor - totalVendido, 0);
    metaProximaValor.textContent = formatarMoeda(proximaMeta.valor);
    metaProximaBonus.textContent = `Bônus ao bater: ${formatarMoeda(proximaMeta.bonus)}`;
    metaPercentual.textContent = `${percentual.toFixed(1).replace(".", ",")}%`;
    barraMetaPreenchimento.style.width = `${percentual}%`;
    metaFaltante.textContent = formatarMoeda(faltante);
    sidebarMetaValor.textContent = formatarMoeda(proximaMeta.valor);
    sidebarMetaFaltam.textContent = `Faltam ${formatarMoeda(faltante)}`;

    if (totalVendido === 0) {
      metaMensagem.textContent = "Continue registrando suas vendas para alcançar a primeira meta.";
    } else {
      metaMensagem.textContent = `Você já alcançou ${formatarMoeda(totalVendido)} neste período. Faltam ${formatarMoeda(faltante)} para a próxima meta.`;
    }
  } else {
    metaProximaValor.textContent = formatarMoeda(METAS[METAS.length - 1].valor);
    metaProximaBonus.textContent = `Bônus máximo conquistado: ${formatarMoeda(METAS[METAS.length - 1].bonus)}`;
    metaPercentual.textContent = "100%";
    barraMetaPreenchimento.style.width = "100%";
    metaFaltante.textContent = formatarMoeda(0);
    metaMensagem.textContent = "Parabéns! Você alcançou a maior meta cadastrada para este período.";
    sidebarMetaValor.textContent = "Meta máxima";
    sidebarMetaFaltam.textContent = `Bônus: ${formatarMoeda(METAS[METAS.length - 1].bonus)}`;
  }

  if (dispararCelebracao && maiorMetaAtingida && maiorMetaAtingida.valor > ultimaMetaAtingida) {
    localStorage.setItem(CHAVE_META_ATINGIDA, String(maiorMetaAtingida.valor));
    celebrarMeta(maiorMetaAtingida);
  }
}

function atualizarResumo(vendasExibidas, dispararCelebracao = false) {
  const totalVendido = vendasExibidas.reduce((acumulador, venda) => acumulador + venda.valor, 0);
  const totalComissao = vendasExibidas.reduce((acumulador, venda) => acumulador + venda.comissao, 0);
  totalVendasElemento.textContent = formatarMoeda(totalVendido);
  totalComissaoElemento.textContent = formatarMoeda(totalComissao);
  quantidadeVendasElemento.textContent = vendasExibidas.length;
  atualizarInsights(vendasExibidas, totalVendido, totalComissao);
  atualizarMetas(totalVendido, dispararCelebracao);
  atualizarGrafico(vendasExibidas);
}

function criarCelula(texto) {
  const celula = document.createElement("td");
  celula.textContent = texto;
  return celula;
}

function criarLinhaVenda(venda) {
  const linha = document.createElement("tr");
  const colunaData = criarCelula(formatarData(venda.data));
  const colunaCliente = criarCelula(venda.cliente || "Não informado");
  const colunaValor = criarCelula(formatarMoeda(venda.valor));
  const colunaComissao = criarCelula(formatarMoeda(venda.comissao));
  const colunaAcao = document.createElement("td");
  const botaoExcluir = document.createElement("button");
  botaoExcluir.type = "button";
  botaoExcluir.className = "botao-excluir";
  botaoExcluir.textContent = "Excluir";
  botaoExcluir.setAttribute("aria-label", `Excluir venda de ${formatarMoeda(venda.valor)}`);
  botaoExcluir.addEventListener("click", () => excluirVenda(venda.id));
  colunaAcao.appendChild(botaoExcluir);
  linha.append(colunaData, colunaCliente, colunaValor, colunaComissao, colunaAcao);
  return linha;
}

function renderizarVendas(opcoes = {}) {
  const { dispararCelebracao = false } = opcoes;
  listaVendas.replaceChildren();
  const vendasFiltradas = obterVendasFiltradas();
  const vendasOrdenadas = [...vendasFiltradas].sort((vendaA, vendaB) => new Date(vendaB.data) - new Date(vendaA.data));
  avisoSemVendas.hidden = vendasOrdenadas.length > 0;
  vendasOrdenadas.forEach((venda) => {
    listaVendas.appendChild(criarLinhaVenda(venda));
  });
  atualizarResumo(vendasOrdenadas, dispararCelebracao);
}

function adicionarVenda(evento) {
  evento.preventDefault();

  const dadosFormulario = {
    valor: Number(campoValorVenda.value),
    data: campoDataVenda.value,
    cliente: campoCliente.value.trim()
  };

  if (schemaVenda) {
    const validacao = schemaVenda.safeParse(dadosFormulario);

    if (!validacao.success) {
      const primeiroErro = validacao.error.issues[0];
      const campoComErro = primeiroErro.path[0];

      exibirAlertaErro("Dados inválidos", primeiroErro.message);

      if (campoComErro === "valor") campoValorVenda.focus();
      if (campoComErro === "data") campoDataVenda.focus();
      if (campoComErro === "cliente") campoCliente.focus();
      return;
    }

    Object.assign(dadosFormulario, validacao.data);
  } else {
    if (!Number.isFinite(dadosFormulario.valor) || dadosFormulario.valor <= 0) {
      exibirAlertaErro("Valor inválido", "Digite um valor de venda maior que zero.");
      campoValorVenda.focus();
      return;
    }

    if (!dataIsoValida(dadosFormulario.data)) {
      exibirAlertaErro("Data inválida", "Selecione uma data válida para a venda.");
      campoDataVenda.focus();
      return;
    }
  }

  const novaVenda = {
    id: crypto.randomUUID(),
    valor: dadosFormulario.valor,
    comissao: calcularComissao(dadosFormulario.valor),
    data: dadosFormulario.data,
    cliente: dadosFormulario.cliente
  };

  vendas.push(novaVenda);
  salvarVendas();

  const dataVenda = bibliotecaDayjsDisponivel
    ? dayjs(novaVenda.data)
    : null;

  if (dataVenda) {
    filtroMes.value = String(dataVenda.month());
    filtroAno.value = dataVenda.format("YYYY");
  } else {
    const [ano, mes] = novaVenda.data.split("-");
    filtroMes.value = String(Number(mes) - 1);
    filtroAno.value = ano;
  }

  renderizarVendas({ dispararCelebracao: true });
  formulario.reset();
  campoDataVenda.value = novaVenda.data;
  campoValorVenda.focus();
  exibirToast(`Venda registrada • Comissão: ${formatarMoeda(novaVenda.comissao)}`);
}

async function excluirVenda(idVenda) {
  const vendaEncontrada = vendas.find((venda) => venda.id === idVenda);
  if (!vendaEncontrada) return;

  let desejaExcluir = true;

  if (typeof Swal !== "undefined") {
    const resultado = await Swal.fire({
      icon: "warning",
      title: "Excluir esta venda?",
      text: `${formatarMoeda(vendaEncontrada.valor)} será removido do histórico.`,
      showCancelButton: true,
      confirmButtonText: "Sim, excluir",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      focusCancel: true
    });
    desejaExcluir = resultado.isConfirmed;
  } else {
    desejaExcluir = window.confirm(`Deseja excluir a venda de ${formatarMoeda(vendaEncontrada.valor)}?`);
  }

  if (!desejaExcluir) return;

  vendas = vendas.filter((venda) => venda.id !== idVenda);
  salvarVendas();
  renderizarVendas();
  exibirToast("Venda excluída com sucesso.");
}

async function apagarTodasAsVendas() {
  if (vendas.length === 0) {
    exibirAlertaErro("Histórico vazio", "Não existem vendas para apagar.");
    return;
  }

  let desejaApagarTudo = true;

  if (typeof Swal !== "undefined") {
    const resultado = await Swal.fire({
      icon: "warning",
      title: "Apagar todas as vendas?",
      text: "Essa ação não poderá ser desfeita.",
      showCancelButton: true,
      confirmButtonText: "Sim, apagar tudo",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      focusCancel: true
    });
    desejaApagarTudo = resultado.isConfirmed;
  } else {
    desejaApagarTudo = window.confirm("Deseja apagar todas as vendas? Essa ação não poderá ser desfeita.");
  }

  if (!desejaApagarTudo) return;

  vendas = [];
  salvarVendas();
  localStorage.removeItem(CHAVE_META_ATINGIDA);
  renderizarVendas();
  exibirToast("Todas as vendas foram apagadas.");
}


function escaparCsv(valor) {
  const texto = String(valor ?? "");
  return `"${texto.replace(/"/g, '""')}"`;
}

function exportarVendasCsv() {
  const vendasFiltradas = obterVendasFiltradas()
    .slice()
    .sort((a, b) => new Date(a.data) - new Date(b.data));

  if (vendasFiltradas.length === 0) {
    exibirAlertaErro("Nenhuma venda para exportar", "Ajuste os filtros ou registre uma venda antes de gerar o relatório.");
    return;
  }

  const cabecalho = ["Data", "Cliente", "Valor da venda", "Comissão", "Percentual da comissão"];
  const linhas = vendasFiltradas.map((venda) => [
    formatarData(venda.data),
    venda.cliente || "Não informado",
    venda.valor.toFixed(2).replace(".", ","),
    venda.comissao.toFixed(2).replace(".", ","),
    `${(TAXA_COMISSAO * 100).toFixed(2).replace(".", ",")}%`
  ]);

  const conteudo = [cabecalho, ...linhas]
    .map((linha) => linha.map(escaparCsv).join(";"))
    .join("\r\n");

  const blob = new Blob(["\uFEFF", conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dataArquivo = bibliotecaDayjsDisponivel
    ? dayjs().format("YYYY-MM-DD")
    : new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `relatorio-vendas-${dataArquivo}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  exibirToast(`${vendasFiltradas.length} venda(s) exportada(s) para CSV.`);
}

function aplicarTema(tema) {
  const temaEscuro = tema === "escuro";
  document.documentElement.dataset.theme = temaEscuro ? "escuro" : "claro";
  document.documentElement.style.colorScheme = temaEscuro ? "dark" : "light";

  if (botaoTema) {
    botaoTema.setAttribute("aria-pressed", String(temaEscuro));
    botaoTema.setAttribute("aria-label", temaEscuro ? "Ativar tema claro" : "Ativar tema escuro");
  }
  if (iconeTema) iconeTema.textContent = temaEscuro ? "☀" : "☾";
  if (textoTema) textoTema.textContent = temaEscuro ? "Tema claro" : "Tema escuro";
  if (metaThemeColor) metaThemeColor.setAttribute("content", temaEscuro ? "#08152f" : "#17316d");
}

function definirTemaInicial() {
  const temaSalvo = localStorage.getItem(CHAVE_TEMA);
  const prefereEscuro = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  aplicarTema(temaSalvo || (prefereEscuro ? "escuro" : "claro"));
}

function alternarTema() {
  const temaAtual = document.documentElement.dataset.theme === "escuro" ? "escuro" : "claro";
  const novoTema = temaAtual === "escuro" ? "claro" : "escuro";
  localStorage.setItem(CHAVE_TEMA, novoTema);
  aplicarTema(novoTema);
}

function limparFiltros() {
  filtroMes.value = "todos";
  filtroAno.value = "";
  renderizarVendas();
}

window.addEventListener("beforeinstallprompt", (evento) => {
  evento.preventDefault();
  eventoInstalacaoPwa = evento;
  if (botaoInstalar) botaoInstalar.hidden = false;
});

if (botaoInstalar) {
  botaoInstalar.addEventListener("click", async () => {
    if (!eventoInstalacaoPwa) return;
    eventoInstalacaoPwa.prompt();
    await eventoInstalacaoPwa.userChoice;
    eventoInstalacaoPwa = null;
    botaoInstalar.hidden = true;
  });
}

window.addEventListener("appinstalled", () => {
  eventoInstalacaoPwa = null;
  if (botaoInstalar) botaoInstalar.hidden = true;
  exibirToast("Aplicativo instalado com sucesso.");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((erro) => {
      console.error("Não foi possível registrar o Service Worker:", erro);
    });
  });
}

formulario.addEventListener("submit", adicionarVenda);
filtroMes.addEventListener("change", () => renderizarVendas());
filtroAno.addEventListener("input", () => renderizarVendas());
botaoLimparFiltros.addEventListener("click", limparFiltros);
botaoApagarTudo.addEventListener("click", apagarTodasAsVendas);
if (botaoExportarCsv) botaoExportarCsv.addEventListener("click", exportarVendasCsv);
if (botaoTema) botaoTema.addEventListener("click", alternarTema);

definirTemaInicial();
definirDatasIniciais();
iniciarCarrossel();
renderizarVendas();
