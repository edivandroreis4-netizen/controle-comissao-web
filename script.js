const TAXA_COMISSAO = 0.02;
const CHAVE_LOCAL_STORAGE = "vendasComissao";

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
const insightMelhorVendaTexto = document.querySelector(
  "#insight-melhor-venda-texto"
);
const insightComissao = document.querySelector("#insight-comissao");
const insightTicketMedio = document.querySelector("#insight-ticket-medio");
const insightMelhorDia = document.querySelector("#insight-melhor-dia");
const insightMelhorDiaTexto = document.querySelector(
  "#insight-melhor-dia-texto"
);

let vendas = carregarVendas();
let carrosselInsights;

function carregarVendas() {
  const vendasSalvas = localStorage.getItem(CHAVE_LOCAL_STORAGE);

  if (!vendasSalvas) {
    return [];
  }

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
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
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
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function iniciarCarrossel() {
  const reduzirMovimento = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

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
      1100: {
        perPage: 2
      },
      700: {
        perPage: 1
      }
    },
    i18n: {
      prev: "Voltar para o insight anterior",
      next: "Avançar para o próximo insight",
      first: "Ir para o primeiro insight",
      last: "Ir para o último insight",
      slideX: "Ir para o insight %s",
      pageX: "Ir para a página %s",
      play: "Iniciar rotação automática",
      pause: "Pausar rotação automática",
      carousel: "Carrossel de insights",
      select: "Selecione um insight para exibir"
    }
  });

  carrosselInsights.mount();
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

    const correspondeAoMes =
      mesSelecionado === "todos" ||
      Number(mes) - 1 === Number(mesSelecionado);

    const correspondeAoAno =
      anoSelecionado === "" || Number(ano) === Number(anoSelecionado);

    return correspondeAoMes && correspondeAoAno;
  });
}

function calcularMelhorDia(vendasExibidas) {
  const totaisPorDia = vendasExibidas.reduce((resultado, venda) => {
    resultado[venda.data] = (resultado[venda.data] || 0) + venda.valor;
    return resultado;
  }, {});

  const dias = Object.entries(totaisPorDia);

  if (dias.length === 0) {
    return null;
  }

  const [data, total] = dias.reduce((melhor, atual) => {
    return atual[1] > melhor[1] ? atual : melhor;
  });

  return { data, total };
}

function atualizarInsights(vendasExibidas, totalVendido, totalComissao) {
  if (vendasExibidas.length === 0) {
    insightMelhorVenda.textContent = formatarMoeda(0);
    insightMelhorVendaTexto.textContent =
      "Registre uma venda para gerar este indicador.";
    insightComissao.textContent = formatarMoeda(0);
    insightTicketMedio.textContent = formatarMoeda(0);
    insightMelhorDia.textContent = "Sem dados";
    insightMelhorDiaTexto.textContent =
      "O sistema identificará o dia com maior total vendido.";
    return;
  }

  const melhorVenda = vendasExibidas.reduce((maior, venda) => {
    return venda.valor > maior.valor ? venda : maior;
  });

  const ticketMedio = totalVendido / vendasExibidas.length;
  const melhorDia = calcularMelhorDia(vendasExibidas);

  insightMelhorVenda.textContent = formatarMoeda(melhorVenda.valor);
  insightMelhorVendaTexto.textContent =
    `Registrada em ${formatarData(melhorVenda.data)}${
      melhorVenda.cliente ? ` para ${melhorVenda.cliente}` : ""
    }.`;

  insightComissao.textContent = formatarMoeda(totalComissao);
  insightTicketMedio.textContent = formatarMoeda(ticketMedio);

  insightMelhorDia.textContent = formatarData(melhorDia.data);
  insightMelhorDiaTexto.textContent =
    `${formatarMoeda(melhorDia.total)} em vendas nesse dia.`;
}

function atualizarResumo(vendasExibidas) {
  const totalVendido = vendasExibidas.reduce(
    (acumulador, venda) => acumulador + venda.valor,
    0
  );

  const totalComissao = vendasExibidas.reduce(
    (acumulador, venda) => acumulador + venda.comissao,
    0
  );

  totalVendasElemento.textContent = formatarMoeda(totalVendido);
  totalComissaoElemento.textContent = formatarMoeda(totalComissao);
  quantidadeVendasElemento.textContent = vendasExibidas.length;

  atualizarInsights(vendasExibidas, totalVendido, totalComissao);
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
  botaoExcluir.setAttribute(
    "aria-label",
    `Excluir venda de ${formatarMoeda(venda.valor)}`
  );

  botaoExcluir.addEventListener("click", () => excluirVenda(venda.id));
  colunaAcao.appendChild(botaoExcluir);

  linha.append(
    colunaData,
    colunaCliente,
    colunaValor,
    colunaComissao,
    colunaAcao
  );

  return linha;
}

function renderizarVendas() {
  listaVendas.replaceChildren();

  const vendasFiltradas = obterVendasFiltradas();
  const vendasOrdenadas = [...vendasFiltradas].sort(
    (vendaA, vendaB) => new Date(vendaB.data) - new Date(vendaA.data)
  );

  avisoSemVendas.hidden = vendasOrdenadas.length > 0;

  vendasOrdenadas.forEach((venda) => {
    listaVendas.appendChild(criarLinhaVenda(venda));
  });

  atualizarResumo(vendasOrdenadas);
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

  renderizarVendas();

  formulario.reset();
  campoDataVenda.value = dataVenda;
  campoValorVenda.focus();

  mostrarMensagem(
    `Venda registrada. Sua comissão será de ${formatarMoeda(
      novaVenda.comissao
    )}.`,
    "sucesso"
  );
}

function excluirVenda(idVenda) {
  const vendaEncontrada = vendas.find((venda) => venda.id === idVenda);

  if (!vendaEncontrada) {
    return;
  }

  const desejaExcluir = window.confirm(
    `Deseja excluir a venda de ${formatarMoeda(vendaEncontrada.valor)}?`
  );

  if (!desejaExcluir) {
    return;
  }

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

  const desejaApagarTudo = window.confirm(
    "Deseja apagar todas as vendas? Essa ação não poderá ser desfeita."
  );

  if (!desejaApagarTudo) {
    return;
  }

  vendas = [];
  salvarVendas();
  renderizarVendas();
  mostrarMensagem("Todas as vendas foram apagadas.", "sucesso");
}

function limparFiltros() {
  filtroMes.value = "todos";
  filtroAno.value = "";
  renderizarVendas();
}

formulario.addEventListener("submit", adicionarVenda);
filtroMes.addEventListener("change", renderizarVendas);
filtroAno.addEventListener("input", renderizarVendas);
botaoLimparFiltros.addEventListener("click", limparFiltros);
botaoApagarTudo.addEventListener("click", apagarTodasAsVendas);

definirDatasIniciais();
iniciarCarrossel();
renderizarVendas();
