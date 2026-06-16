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

let vendas = carregarVendas();

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

  const dataSelecionada = new Date(`${dataVenda}T12:00:00`);
  filtroMes.value = String(dataSelecionada.getMonth());
  filtroAno.value = String(dataSelecionada.getFullYear());

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
renderizarVendas();
