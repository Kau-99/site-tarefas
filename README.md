TaskMaster Pro - Gerenciador de Tarefas Desktop com Electron
Sobre o Projeto
O TaskMaster Pro é um aplicativo de gerenciador de tarefas para desktop, desenvolvido com Electron. Ele foi projetado para funcionar como um widget ou uma caixa flutuante, permitindo acesso rápido e organização de tarefas sem interromper o fluxo de trabalho.

O objetivo foi criar uma ferramenta completa, com funcionalidades avançadas de organização e persistência de dados, encapsulada em uma interface de desktop limpa e moderna.

Funcionalidades Principais
Gerenciamento de Tarefas
Adicionar Tarefas: Crie tarefas com descrição, categoria (Trabalho, Pessoal, etc.), prioridade (Baixa, Média, Alta) e data de vencimento.

Edição e Exclusão: Edite tarefas existentes diretamente na interface e exclua com um modal de confirmação.

Filtros Dinâmicos: Filtre a visualização de tarefas entre "Todas", "Ativas" e "Concluídas".

Ordenação Flexível: Organize a lista por data (mais novas ou mais antigas), por prioridade ou em ordem alfabética.

Pesquisa Instantânea: Encontre tarefas rapidamente pesquisando por texto, categoria ou prioridade.

Interface e Experiência do Usuário
Tema Claro e Escuro: Alterne entre os modos de visualização, com a preferência salva localmente.

Dashboard de Estatísticas: Veja um resumo com o total de tarefas, pendentes, concluídas e de alta prioridade.

Barra de Progresso: Acompanhe visualmente a porcentagem de tarefas concluídas.

Notificações (Toasts): Receba feedback visual para ações como adicionar, excluir ou exportar tarefas.

Design Responsivo: A interface se adapta a diferentes tamanhos de janela, embora o aplicativo seja de tamanho fixo.

Funcionalidades do Aplicativo
Persistência de Dados: Todas as tarefas e preferências são salvas no localStorage, mantendo seus dados entre as sessões.

Importar e Exportar: Salve backups de suas tarefas em arquivos .json e .csv, ou importe tarefas de um arquivo JSON.

Atalho Global: Mostre ou oculte a janela do aplicativo a qualquer momento usando o atalho CommandOrControl+Alt+T.

Ícone na Bandeja (System Tray): O aplicativo permanece em execução na bandeja do sistema para acesso rápido, com opções de mostrar/ocultar e sair.

Janela Flutuante: A janela não possui bordas padrão (frame: false) e pode ser arrastada pela área do cabeçalho.

Tecnologias Utilizadas
Electron: Framework principal para criar o aplicativo desktop com tecnologias web.

HTML5: Estrutura da interface do usuário.

CSS3: Estilização, incluindo tema escuro, animações e layout com Flexbox e Grid.

JavaScript (ES6+): Lógica completa do aplicativo, manipulação do DOM e gerenciamento do estado das tarefas.

Node.js: Ambiente de execução para o processo principal do Electron.

Como Executar Localmente
Pré-requisitos: É necessário ter o Node.js e o npm instalados em sua máquina.

Clone o repositório:

Bash

git clone https://github.com/Kau-99/site-tarefas.git
Navegue até o diretório do projeto:

Bash

cd site-tarefas
Instale as dependências:

Bash

npm install
Inicie o aplicativo:

Bash

npm start
Atalhos de Teclado
Ctrl/Cmd + Alt + T: Mostrar / Ocultar a janela do aplicativo (atalho global).

Enter (no campo de input): Adicionar uma nova tarefa.

Ctrl/Cmd + F: Focar no campo de pesquisa.

Ctrl/Cmd + /: Alternar entre tema claro e escuro.
