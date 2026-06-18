const TAXA_COMISSAO = 0.02;
const CHAVE_LOCAL_STORAGE = "vendasComissao";
const CHAVE_META_ATINGIDA = "ultimaMetaAtingida";
const METAS = [
  { valor: 200000, bonus: 400 },
  { valor: 250000, bonus: 600 },
  { valor: 300000, bonus: 800 },
  { valor: 350000, bonus: 1000 }
];

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

let vendas = carregarVendas();
let carrosselInsights;

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

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function calcularComissao(valorVenda) {
  return valorVenda * TAXA_COMISSAO;
}

function definirDatasIniciais() {
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
  const valorVenda = Number(campoValorVenda.value);
  const dataVenda = campoDataVenda.value;
  const cliente = campoCliente.value.trim();

  if (!Number.isFinite(valorVenda) || valorVenda <= 0) {
    mostrarMensagem("Digite um valor de venda válido.", "erro");
    campoValorVenda.focus();
    return;
  }
  if (!dataVenda) {
    mostrarMensagem("Selecione a data da venda.", "erro");
    campoDataVenda.focus();
    return;
  }

  const novaVenda = {
    id: crypto.randomUUID(),
    valor: valorVenda,
    comissao: calcularComissao(valorVenda),
    data: dataVenda,
    cliente
  };

  vendas.push(novaVenda);
  salvarVendas();

  const [ano, mes] = dataVenda.split("-");
  filtroMes.value = String(Number(mes) - 1);
  filtroAno.value = ano;

  renderizarVendas({ dispararCelebracao: true });
  formulario.reset();
  campoDataVenda.value = dataVenda;
  campoValorVenda.focus();
  mostrarMensagem(`Venda registrada. Sua comissão será de ${formatarMoeda(novaVenda.comissao)}.`, "sucesso");
}

function excluirVenda(idVenda) {
  const vendaEncontrada = vendas.find((venda) => venda.id === idVenda);
  if (!vendaEncontrada) return;
  const desejaExcluir = window.confirm(`Deseja excluir a venda de ${formatarMoeda(vendaEncontrada.valor)}?`);
  if (!desejaExcluir) return;
  vendas = vendas.filter((venda) => venda.id !== idVenda);
  salvarVendas();
  renderizarVendas();
  mostrarMensagem("Venda excluída com sucesso.", "sucesso");
}

function apagarTodasAsVendas() {
  if (vendas.length === 0) {
    mostrarMensagem("Não existem vendas para apagar.", "erro");
    return;
  }
  const desejaApagarTudo = window.confirm("Deseja apagar todas as vendas? Essa ação não poderá ser desfeita.");
  if (!desejaApagarTudo) return;
  vendas = [];
  salvarVendas();
  localStorage.removeItem(CHAVE_META_ATINGIDA);
  renderizarVendas();
  mostrarMensagem("Todas as vendas foram apagadas.", "sucesso");
}

function limparFiltros() {
  filtroMes.value = "todos";
  filtroAno.value = "";
  renderizarVendas();
}

formulario.addEventListener("submit", adicionarVenda);
filtroMes.addEventListener("change", () => renderizarVendas());
filtroAno.addEventListener("input", () => renderizarVendas());
botaoLimparFiltros.addEventListener("click", limparFiltros);
botaoApagarTudo.addEventListener("click", apagarTodasAsVendas);

definirDatasIniciais();
iniciarCarrossel();
renderizarVendas();


// Recursos de instalação e funcionamento offline (PWA)
let eventoInstalacaoPendente = null;
const botaoInstalar = document.querySelector("#botao-instalar");
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./service-worker.js");
      console.log("Service Worker registrado com sucesso.");
    } catch (erro) {
      console.error("Não foi possível registrar o Service Worker:", erro);
    }
  });
}
window.addEventListener("beforeinstallprompt", (evento) => {
  evento.preventDefault();
  eventoInstalacaoPendente = evento;
  botaoInstalar.hidden = false;
});
botaoInstalar?.addEventListener("click", async () => {
  if (!eventoInstalacaoPendente) return;
  eventoInstalacaoPendente.prompt();
  const escolha = await eventoInstalacaoPendente.userChoice;
  if (escolha.outcome === "accepted") {
    mostrarMensagem("Aplicativo instalado com sucesso.", "sucesso");
  }
  eventoInstalacaoPendente = null;
  botaoInstalar.hidden = true;
});
window.addEventListener("appinstalled", () => {
  eventoInstalacaoPendente = null;
  botaoInstalar.hidden = true;
});
