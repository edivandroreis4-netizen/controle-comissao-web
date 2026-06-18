# Controle de Vendas e Comissão - versão com metas

Aplicação web responsiva para registrar vendas, calcular automaticamente a
comissão de 2% e acompanhar metas de bonificação.

## Novidades desta versão

- Carrossel de insights ajustado para não cobrir os números;
- Metas de vendas com faixas de bonificação;
- Barra de progresso da próxima meta;
- Lista de metas batidas e próximas metas;
- Animação de celebração ao alcançar uma meta;
- Layout moderno e responsivo.

## Regras de metas

- R$ 200.000,00 = R$ 400,00
- R$ 250.000,00 = R$ 600,00
- R$ 300.000,00 = R$ 800,00
- R$ 350.000,00 = R$ 1.000,00

## Tecnologias

- HTML5
- CSS3
- JavaScript
- Splide.js
- localStorage

## Como executar

Abra o arquivo `index.html` no navegador ou utilize a extensão Live Server.

## Autor

Desenvolvido por Edivandro Lima.


## PWA — aplicativo instalável

Esta versão também pode ser instalada no celular ou computador.

Arquivos adicionados:

- `manifest.json`: nome, cores, ícones e modo de exibição;
- `service-worker.js`: cache e funcionamento offline básico;
- `offline.html`: tela exibida quando a navegação não está disponível;
- `icons/`: ícones para instalação.

Depois de publicar na Vercel, abra o site no Chrome ou Edge e use o botão **Instalar aplicativo** quando ele aparecer.

> Os dados continuam armazenados no `localStorage` de cada dispositivo. A PWA não sincroniza automaticamente notebook e celular.
