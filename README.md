# 🎯 Qual Casal se Conhece Melhor? (Multiplayer)

Este é o jogo **"Qual Casal se Conhece Melhor?"**, perguntas vão aparecer na tela e o objetivo é que ambos do casal respondam da mesma forma. Quem acertar mais respostas em sintonia vence a disputa! 

## ✨ Funcionalidades Implementadas

*   **Multiplayer em Tempo Real:** Utiliza **Socket.IO** para sincronizar o estado do jogo entre 4 jogadores em diferentes dispositivos.
*   **Nova Lógica de Pontuação:** Pontua se as respostas dos parceiros forem **diferentes** (ex: um escolhe "Eu" e o outro escolhe "Meu Parceiro(a)"), indicando que ambos concordam sobre quem é a pessoa em questão.
*   **Fluxo de Sala:** Telas de Criação/Entrada de Sala e Lobby de espera.
*   **Design Responsivo:** Otimizado para celular.
*   **30 Perguntas:** Banco de perguntas armazenado no servidor.
*   
## 🎮 Como Jogar

1.  **Crie a Sala:** O primeiro jogador clica em "Criar Sala". O código da sala será exibido.
2.  **Compartilhe o Código:** Compartilhe o código da sala com os outros 3 jogadores.
3.  **Entrem na Sala:** Os outros 3 jogadores acessam o mesmo link e usam a opção "Entrar" com o código da sala.
4.  **Cadastro:** Cada jogador insere seu nome e seleciona seu casal (deve haver 2 no Casal A e 2 no Casal B).
5.  **Início:** O jogo começa automaticamente quando o 4º jogador se cadastra.
6.  **Responda:** Cada jogador responde à pergunta em seu próprio dispositivo.
7.  **Pontuação:** O servidor verifica a lógica de pontuação invertida e avança para a próxima pergunta.

## 📁 Estrutura do Projeto

| Arquivo | Localização | Descrição |
| :--- | :--- | :--- |
| `server.js` | Raiz do projeto | Servidor Node.js com Express e Socket.IO. Gerencia o estado do jogo e a lógica de pontuação. |
| `package.json` | Raiz do projeto | Dependências do Node.js (Express, Socket.IO). |
| `index.html` | `public/` | Estrutura HTML do cliente. |
| `style.css` | `public/` | Estilização e responsividade. |
| `client.js` | `public/` | Lógica do cliente para comunicação com o servidor via Socket.IO. |

