# Controle de Vendas e Comissão

Aplicação web responsiva e instalável (PWA) para registrar vendas, calcular comissão de 2%, acompanhar metas e analisar o desempenho do período.

## Novidades desta versão

- Gráfico de vendas por dia com Chart.js;
- Alertas modernos com SweetAlert2;
- Datas formatadas e tratadas com Day.js;
- Validação dos dados do formulário com Zod;
- Confirmação segura antes de excluir uma venda;
- Confirmação antes de apagar todo o histórico;
- Notificação discreta ao registrar ou excluir vendas;
- Alerta especial ao atingir uma meta;
- Gráfico atualizado automaticamente pelos filtros de mês e ano;
- PWA com funcionamento offline;
- Carrossel de insights com Splide.js;
- Dados salvos no localStorage.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- Chart.js
- SweetAlert2
- Day.js
- Zod
- Splide.js
- localStorage
- Service Worker e Web App Manifest

## Como atualizar o projeto

Substitua os arquivos da pasta do projeto pelos arquivos desta versão. Preserve a estrutura de pastas, incluindo `assets` e `icons`.

Depois execute:

```bash
git add .
git commit -m "feat: adiciona Day.js e Zod ao painel"
git push
```

## Autor

Desenvolvido por Edivandro Lima.


## Novos recursos

- Exportação das vendas filtradas em CSV compatível com Excel e Google Planilhas.
- Tema claro e escuro com preferência salva no localStorage.
- O relatório CSV inclui data, cliente, valor da venda, comissão e percentual.


## Atualização: edição e acompanhamento de orçamentos

- Edição de vendas já registradas, sem duplicar o histórico.
- Exclusão individual com confirmação.
- Cadastro, edição e exclusão de orçamentos.
- Alertas de contato a cada 8 dias ao abrir o aplicativo.
- Ação de WhatsApp com mensagem pronta.
- Registro de contato realizado e novo prazo automático.
- Conversão de orçamento em venda.
- Filtros por busca e status.
- Armazenamento separado em localStorage.

> Sem backend, os alertas aparecem quando o aplicativo é aberto ou atualizado.
