# 🎯 Qual Casal se Conhece Melhor? (Multiplayer)

Este é o jogo **"Qual Casal se Conhece Melhor?"** migrado para uma arquitetura **Full-Stack (Node.js, Express e Socket.IO)** para suportar o acesso de **múltiplos dispositivos** em tempo real, conforme solicitado.

## ✨ Funcionalidades Implementadas

*   **Multiplayer em Tempo Real:** Utiliza **Socket.IO** para sincronizar o estado do jogo entre 4 jogadores em diferentes dispositivos.
*   **Nova Lógica de Pontuação:** Pontua se as respostas dos parceiros forem **diferentes** (ex: um escolhe "Eu" e o outro escolhe "Meu Parceiro(a)"), indicando que ambos concordam sobre quem é a pessoa em questão.
*   **Fluxo de Sala:** Telas de Criação/Entrada de Sala e Lobby de espera.
*   **Design Responsivo:** Otimizado para celular.
*   **30 Perguntas:** Banco de perguntas armazenado no servidor.

## 📁 Estrutura do Projeto

| Arquivo | Localização | Descrição |
| :--- | :--- | :--- |
| `server.js` | Raiz do projeto | Servidor Node.js com Express e Socket.IO. Gerencia o estado do jogo e a lógica de pontuação. |
| `package.json` | Raiz do projeto | Dependências do Node.js (Express, Socket.IO). |
| `index.html` | `public/` | Estrutura HTML do cliente. |
| `style.css` | `public/` | Estilização e responsividade. |
| `client.js` | `public/` | Lógica do cliente para comunicação com o servidor via Socket.IO. |

## 🚀 Como Rodar o Jogo (Localmente)

Para rodar o jogo em seu ambiente, siga os passos:

1.  **Instalar Node.js:** Certifique-se de ter o Node.js instalado em sua máquina.
2.  **Criar a Pasta:** Crie uma pasta para o projeto (ex: `jogo-casal-multiplayer`).
3.  **Salvar Arquivos:** Salve os arquivos `server.js` e `package.json` na raiz da pasta. Crie a subpasta `public` e salve `index.html`, `style.css` e `client.js` dentro dela.
4.  **Instalar Dependências:** Abra o terminal na pasta raiz do projeto e execute:
    ```bash
    npm install
    ```
5.  **Iniciar o Servidor:** Execute o servidor com o comando:
    ```bash
    node server.js
    ```
6.  **Acessar o Jogo:** Abra o navegador e acesse `http://localhost:3000`.

## 🎮 Como Jogar

1.  **Crie a Sala:** O primeiro jogador clica em "Criar Sala". O código da sala será exibido.
2.  **Compartilhe o Código:** Compartilhe o código da sala com os outros 3 jogadores.
3.  **Entrem na Sala:** Os outros 3 jogadores acessam o mesmo link e usam a opção "Entrar" com o código da sala.
4.  **Cadastro:** Cada jogador insere seu nome e seleciona seu casal (deve haver 2 no Casal A e 2 no Casal B).
5.  **Início:** O jogo começa automaticamente quando o 4º jogador se cadastra.
6.  **Responda:** Cada jogador responde à pergunta em seu próprio dispositivo.
7.  **Pontuação:** O servidor verifica a lógica de pontuação invertida e avança para a próxima pergunta.

---

## 📄 Código Completo

### 1. `server.js`

\`\`\`javascript
// ===================================
// SERVIDOR MULTIPLAYER - QUAL CASAL SE CONHECE MELHOR?
// ===================================

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Porta
const PORT = process.env.PORT || 3000;

// ===================================
// ESTADO DO JOGO
// ===================================

// Array com 30 perguntas sobre relacionamento
const perguntas = [
    "Quem costuma ter razão nas discussões?",
    "Quem demora mais para responder mensagens?",
    "Quem sempre esquece onde guardou as coisas?",
    "Quem é mais romântico?",
    "Quem acorda mais cedo?",
    "Quem é mais organizado?",
    "Quem gasta mais dinheiro com compras desnecessárias?",
    "Quem é mais ciumento?",
    "Quem cozinha melhor?",
    "Quem é mais aventureiro?",
    "Quem é mais tímido?",
    "Quem fala mais?",
    "Quem é mais paciente?",
    "Quem é mais ambicioso?",
    "Quem é mais engraçado?",
    "Quem é mais sensível?",
    "Quem é mais preguiçoso?",
    "Quem é mais competitivo?",
    "Quem é mais criativo?",
    "Quem é mais impulsivo?",
    "Quem é mais cuidadoso com a saúde?",
    "Quem é mais social?",
    "Quem é mais perfeccionista?",
    "Quem é mais otimista?",
    "Quem é mais pessimista?",
    "Quem é mais leal?",
    "Quem é mais independente?",
    "Quem é mais carinhoso?",
    "Quem é mais crítico?",
    "Quem é mais confiável?"
];

// Estado global do jogo
const estadoGlobal = {
    salas: {} // { salaId: { jogadores: {}, estado: 'aguardando'|'jogando'|'finalizado', ... } }
};

// ===================================
// FUNÇÕES UTILITÁRIAS
// ===================================

/**
 * Gera um ID único para a sala
 */
function gerarIdSala() {
    // Gera um ID de 6 caracteres alfanuméricos
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

/**
 * Embaralha um array (Fisher-Yates)
 */
function embaralhar(array) {
    const copia = [...array];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

/**
 * Inicializa uma nova sala
 */
function inicializarSala(salaId) {
    estadoGlobal.salas[salaId] = {
        jogadores: {},
        estado: 'aguardando', // aguardando | jogando | finalizado
        perguntaAtual: 0,
        perguntasEmbaralhadas: embaralhar(perguntas),
        placarCasalA: 0,
        placarCasalB: 0,
        respostasPerguntaAtual: {},
        jogadoresResponderam: new Set()
    };
}

/**
 * Verifica se todos os 4 jogadores estão na sala
 */
function todosJogadoresPresentes(salaId) {
    const sala = estadoGlobal.salas[salaId];
    if (!sala) return false;
    
    const jogadores = Object.values(sala.jogadores);
    if (jogadores.length !== 4) return false;
    
    // Verifica se há 2 jogadores em cada casal
    const casalA = jogadores.filter(j => j.casal === 'A').length;
    const casalB = jogadores.filter(j => j.casal === 'B').length;
    
    return casalA === 2 && casalB === 2;
}

/**
 * Inicia o jogo em uma sala
 */
function iniciarJogo(salaId) {
    const sala = estadoGlobal.salas[salaId];
    sala.estado = 'jogando';
    sala.perguntaAtual = 0;
    sala.placarCasalA = 0;
    sala.placarCasalB = 0;
    sala.perguntasEmbaralhadas = embaralhar(perguntas);
    
    // Notifica todos os clientes
    io.to(salaId).emit('jogo-iniciado', {
        pergunta: sala.perguntasEmbaralhadas[0],
        perguntaIndex: 1,
        totalPerguntas: sala.perguntasEmbaralhadas.length
    });
}

/**
 * Verifica as respostas e atualiza o placar
 * LÓGICA INVERTIDA: Pontua se as respostas forem DIFERENTES
 */
function verificarRespostas(salaId) {
    const sala = estadoGlobal.salas[salaId];
    
    // Obtém os jogadores de cada casal
    const jogadores = Object.values(sala.jogadores);
    const jogadoresCasalA = jogadores.filter(j => j.casal === 'A');
    const jogadoresCasalB = jogadores.filter(j => j.casal === 'B');
    
    // Obtém as respostas
    const respostaCasalA1 = sala.respostasPerguntaAtual[jogadoresCasalA[0].id];
    const respostaCasalA2 = sala.respostasPerguntaAtual[jogadoresCasalA[1].id];
    
    const respostaCasalB1 = sala.respostasPerguntaAtual[jogadoresCasalB[0].id];
    const respostaCasalB2 = sala.respostasPerguntaAtual[jogadoresCasalB[1].id];
    
    // LÓGICA INVERTIDA: Pontua se as respostas forem DIFERENTES
    // Se um escolhe "Eu" e o outro "Meu Parceiro(a)", eles concordam sobre quem é a pessoa.
    let casalAAcertou = respostaCasalA1 !== respostaCasalA2;
    let casalBAcertou = respostaCasalB1 !== respostaCasalB2;
    
    // Atualiza o placar
    if (casalAAcertou) {
        sala.placarCasalA++;
    }
    
    if (casalBAcertou) {
        sala.placarCasalB++;
    }
    
    // Retorna o resultado
    return {
        casalAAcertou,
        casalBAcertou,
        placarCasalA: sala.placarCasalA,
        placarCasalB: sala.placarCasalB
    };
}

/**
 * Avança para a próxima pergunta
 */
function avancarPergunta(salaId) {
    const sala = estadoGlobal.salas[salaId];
    sala.perguntaAtual++;
    sala.respostasPerguntaAtual = {};
    sala.jogadoresResponderam.clear();
    
    // Verifica se o jogo acabou
    if (sala.perguntaAtual >= sala.perguntasEmbaralhadas.length) {
        sala.estado = 'finalizado';
        return null; // Jogo finalizado
    }
    
    // Retorna a próxima pergunta
    return {
        pergunta: sala.perguntasEmbaralhadas[sala.perguntaAtual],
        perguntaIndex: sala.perguntaAtual + 1,
        totalPerguntas: sala.perguntasEmbaralhadas.length
    };
}

// ===================================
// EVENTOS DO SOCKET.IO
// ===================================

io.on('connection', (socket) => {
    console.log(`Novo cliente conectado: ${socket.id}`);
    
    // ===================================
    // EVENTO: Criar ou Entrar em uma Sala
    // ===================================
    socket.on('criar-ou-entrar-sala', (dados, callback) => {
        const { salaId, nome, casal } = dados;
        
        // 1. Criação de Sala (se salaId for nulo)
        let idSala = salaId;
        if (!idSala) {
            idSala = gerarIdSala();
            inicializarSala(idSala);
            console.log(`Sala criada: ${idSala}`);
        }
        
        // 2. Validação da Sala
        if (!estadoGlobal.salas[idSala]) {
            callback({ sucesso: false, mensagem: 'Sala não encontrada ou inválida.' });
            return;
        }
        
        const sala = estadoGlobal.salas[idSala];
        
        // 3. Validação de Cadastro (se nome e casal estiverem presentes)
        if (nome && casal) {
            // Verifica se a sala está cheia
            if (Object.keys(sala.jogadores).length >= 4) {
                callback({ sucesso: false, mensagem: 'Sala cheia! Máximo de 4 jogadores.' });
                return;
            }
            
            // Adiciona o jogador à sala
            socket.join(idSala);
            sala.jogadores[socket.id] = {
                id: socket.id,
                nome: nome,
                casal: casal,
                resposta: null
            };
            
            console.log(`Jogador ${nome} (${casal}) entrou na sala ${idSala}`);
            
            // Notifica o cliente
            callback({
                sucesso: true,
                salaId: idSala,
                jogadores: Object.values(sala.jogadores)
            });
            
            // Notifica todos os clientes da sala sobre a atualização
            io.to(idSala).emit('jogadores-atualizados', {
                jogadores: Object.values(sala.jogadores),
                totalJogadores: Object.keys(sala.jogadores).length
            });
            
            // Se todos os 4 jogadores estão presentes, inicia o jogo automaticamente
            if (todosJogadoresPresentes(idSala)) {
                setTimeout(() => {
                    iniciarJogo(idSala);
                }, 1000);
            }
        } else {
            // Retorna o ID da sala para o criador
            callback({
                sucesso: true,
                salaId: idSala,
                jogadores: Object.values(sala.jogadores)
            });
        }
    });
    
    // ===================================
    // EVENTO: Registrar Resposta
    // ===================================
    socket.on('registrar-resposta', (dados) => {
        const { salaId, resposta } = dados;
        const sala = estadoGlobal.salas[salaId];
        
        if (!sala || sala.estado !== 'jogando') return;
        
        // Impede que o jogador responda mais de uma vez
        if (sala.jogadoresResponderam.has(socket.id)) return;
        
        // Registra a resposta
        sala.respostasPerguntaAtual[socket.id] = resposta;
        sala.jogadoresResponderam.add(socket.id);
        
        // Notifica todos os clientes que um jogador respondeu
        io.to(salaId).emit('jogador-respondeu', {
            jogadorId: socket.id,
            jogadorNome: sala.jogadores[socket.id].nome
        });
        
        // Verifica se todos responderam
        if (sala.jogadoresResponderam.size === 4) {
            // Verifica as respostas
            const resultado = verificarRespostas(salaId);
            
            // Notifica todos os clientes com o resultado
            io.to(salaId).emit('resultado-pergunta', resultado);
            
            // Aguarda um pouco e avança para a próxima pergunta
            setTimeout(() => {
                const proximaPergunta = avancarPergunta(salaId);
                
                if (proximaPergunta) {
                    // Próxima pergunta
                    io.to(salaId).emit('proxima-pergunta', proximaPergunta);
                } else {
                    // Jogo finalizado
                    io.to(salaId).emit('jogo-finalizado', {
                        placarCasalA: sala.placarCasalA,
                        placarCasalB: sala.placarCasalB
                    });
                }
            }, 2500);
        }
    });
    
    // ===================================
    // EVENTO: Desconectar
    // ===================================
    socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
        
        // Remove o jogador de todas as salas
        for (const salaId in estadoGlobal.salas) {
            const sala = estadoGlobal.salas[salaId];
            if (sala.jogadores[socket.id]) {
                const nomeJogador = sala.jogadores[socket.id].nome;
                delete sala.jogadores[socket.id];
                console.log(`Jogador ${nomeJogador} removido da sala ${salaId}`);
                
                // Notifica os outros jogadores
                io.to(salaId).emit('jogadores-atualizados', {
                    jogadores: Object.values(sala.jogadores),
                    totalJogadores: Object.keys(sala.jogadores).length
                });
                
                // Se a sala ficou vazia, deleta a sala
                if (Object.keys(sala.jogadores).length === 0) {
                    delete estadoGlobal.salas[salaId];
                    console.log(`Sala ${salaId} deletada`);
                }
            }
        }
    });
    
    // ===================================
    // EVENTO: Reiniciar Jogo
    // ===================================
    socket.on('reiniciar-jogo', (dados) => {
        const { salaId } = dados;
        const sala = estadoGlobal.salas[salaId];
        
        if (!sala) return;
        
        // Reseta o estado do jogo
        sala.perguntaAtual = 0;
        sala.placarCasalA = 0;
        sala.placarCasalB = 0;
        sala.perguntasEmbaralhadas = embaralhar(perguntas);
        sala.respostasPerguntaAtual = {};
        sala.jogadoresResponderam.clear();
        sala.estado = 'jogando';
        
        // Notifica todos os clientes
        io.to(salaId).emit('jogo-reiniciado', {
            pergunta: sala.perguntasEmbaralhadas[0],
            perguntaIndex: 1,
            totalPerguntas: sala.perguntasEmbaralhadas.length
        });
    });
});

// ===================================
// INICIAR SERVIDOR
// ===================================

server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
\`\`\`

### 2. `package.json`

\`\`\`json
{
  "name": "jogo-casal-multiplayer",
  "version": "1.0.0",
  "description": "Jogo 'Qual Casal se Conhece Melhor?' com suporte multiplayer via Node.js e Socket.IO",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "multiplayer",
    "socket.io",
    "node",
    "express",
    "jogo"
  ],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^4.19.2",
    "socket.io": "^4.7.5"
  }
}
\`\`\`

### 3. `public/index.html`

\`\`\`html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Qual Casal se Conhece Melhor?</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- Tela Inicial -->
    <div id="telaInicial" class="tela ativa">
        <div class="container-central">
            <div class="logo-container">
                <div class="emoji-grande">💑</div>
                <h1 class="titulo-principal">Qual Casal se Conhece Melhor?</h1>
                <p class="subtitulo">Um jogo para descobrir qual casal realmente se conhece!</p>
                <p class="instrucoes-inicio">Cada jogador acessa em seu próprio dispositivo</p>
            </div>
            <button id="btnCriarSala" class="botao botao-principal">Criar Sala</button>
            <div class="divisor">OU</div>
            <div class="entrada-sala">
                <input id="inputSalaId" type="text" class="input-sala" placeholder="Digite o código da sala">
                <button id="btnEntrarSala" class="botao botao-secundario">Entrar</button>
            </div>
        </div>
    </div>

    <!-- Tela de Cadastro -->
    <div id="telaCadastro" class="tela">
        <div class="container-central">
            <h2 class="titulo-tela">Cadastro de Jogador</h2>
            <p class="instrucoes">Insira seu nome e selecione seu casal</p>
            <p id="codigoSala" class="codigo-sala"></p>
            
            <div class="formulario-jogador">
                <label class="label-jogador">Seu Nome</label>
                <input 
                    id="inputNomeJogador"
                    type="text" 
                    class="input-nome" 
                    placeholder="Digite seu nome"
                >
                
                <label class="label-jogador">Qual casal você pertence?</label>
                <div class="container-radio">
                    <label class="radio-opcao">
                        <input 
                            type="radio" 
                            name="casal" 
                            value="A"
                            id="casalA"
                        >
                        <span class="radio-label">💑 Casal A</span>
                    </label>
                    <label class="radio-opcao">
                        <input 
                            type="radio" 
                            name="casal" 
                            value="B"
                            id="casalB"
                        >
                        <span class="radio-label">👫 Casal B</span>
                    </label>
                </div>
            </div>
            
            <button id="btnConfirmarJogador" class="botao botao-principal">Confirmar</button>
            
            <div id="aguardandoJogadores" class="aguardando hidden">
                <p class="aguardando-texto">Aguardando outros jogadores...</p>
                <div class="spinner"></div>
                <div id="listaJogadores" class="lista-jogadores"></div>
            </div>
        </div>
    </div>

    <!-- Tela de Perguntas -->
    <div id="telaPerguntas" class="tela">
        <div class="container-perguntas">
            <!-- Placar -->
            <div class="placar-container">
                <div class="placar-item casal-a">
                    <div class="casal-icon">💑</div>
                    <div class="placar-info">
                        <span class="casal-nome">Casal A</span>
                        <span id="placarCasalA" class="placar-numero">0</span>
                    </div>
                </div>
                <div class="placar-item casal-b">
                    <div class="casal-icon">👫</div>
                    <div class="placar-info">
                        <span class="casal-nome">Casal B</span>
                        <span id="placarCasalB" class="placar-numero">0</span>
                    </div>
                </div>
            </div>

            <!-- Indicador de Progresso -->
            <div class="progresso-container">
                <div class="progresso-barra">
                    <div id="progressoBarra" class="progresso-preenchimento"></div>
                </div>
                <span id="progressoTexto" class="progresso-texto">1/30</span>
            </div>

            <!-- Pergunta -->
            <div class="pergunta-container">
                <h3 id="perguntaTexto" class="pergunta-texto"></h3>
            </div>

            <!-- Respostas -->
            <div class="opcoes-resposta">
                <button id="btnEu" class="botao-resposta" data-resposta="Eu">
                    Eu
                </button>
                <button id="btnParceiro" class="botao-resposta" data-resposta="Meu(a) Parceiro(a)">
                    Meu(a) Parceiro(a)
                </button>
            </div>

            <!-- Status de Resposta -->
            <div id="statusResposta" class="status-resposta hidden">
                <p id="textoStatusResposta" class="texto-status"></p>
            </div>

            <!-- Feedback de Acerto/Erro -->
            <div id="feedbackResultado" class="feedback-resultado hidden">
                <div class="feedback-conteudo">
                    <span id="feedbackTexto" class="feedback-texto"></span>
                    <span id="feedbackEmoji" class="feedback-emoji"></span>
                </div>
            </div>
        </div>
    </div>

    <!-- Tela Final -->
    <div id="telaFinal" class="tela">
        <div class="container-central">
            <div class="resultado-container">
                <div class="emoji-resultado">🏆</div>
                <h2 id="textoResultado" class="titulo-resultado"></h2>
                <p id="mensagemResultado" class="mensagem-resultado"></p>
                
                <div class="placar-final">
                    <div class="placar-final-item">
                        <span class="placar-final-casal">Casal A</span>
                        <span id="placarFinalA" class="placar-final-numero">0</span>
                    </div>
                    <span class="vs-texto">vs</span>
                    <div class="placar-final-item">
                        <span class="placar-final-casal">Casal B</span>
                        <span id="placarFinalB" class="placar-final-numero">0</span>
                    </div>
                </div>
            </div>
            
            <button id="btnNovoJogo" class="botao botao-principal">Jogar Novamente</button>
        </div>
    </div>

    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    <script src="client.js"></script>
</body>
</html>
\`\`\`

### 4. `public/style.css`

\`\`\`css
/* (Conteúdo do style.css adaptado para multiplayer - Omitido aqui por brevidade, mas incluído no anexo) */
/* ... (O mesmo conteúdo do style.css da fase 3) ... */
/* Apenas as partes novas/alteradas: */

.instrucoes-inicio {
    font-size: 13px;
    color: var(--cor-destaque);
    font-weight: 600;
    margin-top: 10px;
}

.divisor {
    font-size: 14px;
    color: var(--cor-texto-claro);
    font-weight: 600;
    margin: 10px 0;
}

.entrada-sala {
    display: flex;
    gap: 10px;
    width: 100%;
    max-width: 400px;
}

.input-sala {
    flex: 1;
    padding: 12px 15px;
    border: 2px solid var(--cor-border);
    border-radius: 10px;
    font-size: 14px;
    font-family: inherit;
    transition: var(--transicao);
}

.codigo-sala {
    font-size: 12px;
    color: var(--cor-destaque);
    font-weight: 700;
    background: rgba(255, 165, 2, 0.1);
    padding: 10px 15px;
    border-radius: 10px;
    margin-bottom: 20px;
    font-family: 'Courier New', monospace;
}

.aguardando {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    margin-top: 20px;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--cor-border);
    border-top-color: var(--cor-primaria);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.lista-jogadores {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.item-jogador {
    background: white;
    padding: 12px 15px;
    border-radius: 10px;
    border: 2px solid var(--cor-border);
    font-size: 14px;
    color: var(--cor-texto);
}

.status-resposta {
    background: rgba(46, 204, 113, 0.1);
    border: 2px solid var(--cor-sucesso);
    padding: 15px;
    border-radius: 10px;
    text-align: center;
    margin-top: 10px;
}

/* ... (Restante do CSS) ... */
\`\`\`

### 5. `public/client.js`

\`\`\`javascript
// ===================================
// CLIENTE - QUAL CASAL SE CONHECE MELHOR?
// ===================================

// Conexão com o servidor
const socket = io();

// Estado do cliente
const estadoCliente = {
    salaId: null,
    jogadorId: null,
    jogadorNome: null,
    jogadorCasal: null,
    placarCasalA: 0,
    placarCasalB: 0,
    perguntaAtual: 0,
    totalPerguntas: 0,
    respondeu: false
};

// Elementos do DOM
const telaInicial = document.getElementById('telaInicial');
const telaCadastro = document.getElementById('telaCadastro');
const telaPerguntas = document.getElementById('telaPerguntas');
const telaFinal = document.getElementById('telaFinal');

const btnCriarSala = document.getElementById('btnCriarSala');
const btnEntrarSala = document.getElementById('btnEntrarSala');
const inputSalaId = document.getElementById('inputSalaId');
const inputNomeJogador = document.getElementById('inputNomeJogador');
const casalA = document.getElementById('casalA');
const casalB = document.getElementById('casalB');
const btnConfirmarJogador = document.getElementById('btnConfirmarJogador');
const codigoSala = document.getElementById('codigoSala');
const aguardandoJogadores = document.getElementById('aguardandoJogadores');
const listaJogadores = document.getElementById('listaJogadores');

const perguntaTexto = document.getElementById('perguntaTexto');
const placarCasalA = document.getElementById('placarCasalA');
const placarCasalB = document.getElementById('placarCasalB');
const progressoBarra = document.getElementById('progressoBarra');
const progressoTexto = document.getElementById('progressoTexto');
const btnEu = document.getElementById('btnEu');
const btnParceiro = document.getElementById('btnParceiro');
const statusResposta = document.getElementById('statusResposta');
const textoStatusResposta = document.getElementById('textoStatusResposta');
const feedbackResultado = document.getElementById('feedbackResultado');
const feedbackTexto = document.getElementById('feedbackTexto');
const feedbackEmoji = document.getElementById('feedbackEmoji');

const textoResultado = document.getElementById('textoResultado');
const mensagemResultado = document.getElementById('mensagemResultado');
const placarFinalA = document.getElementById('placarFinalA');
const placarFinalB = document.getElementById('placarFinalB');
const btnNovoJogo = document.getElementById('btnNovoJogo');

// ===================================
// FUNÇÕES DE NAVEGAÇÃO
// ===================================

function mostrarTela(tela) {
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
    tela.classList.add('ativa');
}

// ===================================
// TELA INICIAL
// ===================================

btnCriarSala.addEventListener('click', () => {
    // Envia um pedido para criar uma sala (salaId: null)
    socket.emit('criar-ou-entrar-sala', {
        salaId: null,
        nome: null,
        casal: null
    }, (resposta) => {
        if (resposta.sucesso) {
            estadoCliente.salaId = resposta.salaId;
            mostrarTela(telaCadastro);
            codigoSala.textContent = `Código da Sala: ${resposta.salaId}`;
        } else {
            alert(resposta.mensagem);
        }
    });
});

btnEntrarSala.addEventListener('click', () => {
    const salaId = inputSalaId.value.trim().toUpperCase();
    if (!salaId) {
        alert('Por favor, insira o código da sala');
        return;
    }
    
    // Envia um pedido para entrar em uma sala existente (sem nome/casal ainda)
    socket.emit('criar-ou-entrar-sala', {
        salaId: salaId,
        nome: null,
        casal: null
    }, (resposta) => {
        if (resposta.sucesso) {
            estadoCliente.salaId = resposta.salaId;
            mostrarTela(telaCadastro);
            codigoSala.textContent = `Código da Sala: ${resposta.salaId}`;
            atualizarListaJogadores(resposta.jogadores);
        } else {
            alert(resposta.mensagem);
        }
    });
});

// ===================================
// TELA DE CADASTRO
// ===================================

btnConfirmarJogador.addEventListener('click', () => {
    const nome = inputNomeJogador.value.trim();
    const casal = casalA.checked ? 'A' : (casalB.checked ? 'B' : null);
    
    if (!nome) {
        alert('Por favor, insira seu nome');
        return;
    }
    
    if (!casal) {
        alert('Por favor, selecione seu casal');
        return;
    }
    
    estadoCliente.jogadorNome = nome;
    estadoCliente.jogadorCasal = casal;
    
    // Envia os dados completos para o servidor
    socket.emit('criar-ou-entrar-sala', {
        salaId: estadoCliente.salaId,
        nome: nome,
        casal: casal
    }, (resposta) => {
        if (resposta.sucesso) {
            estadoCliente.jogadorId = socket.id;
            btnConfirmarJogador.disabled = true;
            inputNomeJogador.disabled = true;
            casalA.disabled = true;
            casalB.disabled = true;
            
            document.querySelector('.formulario-jogador').style.display = 'none';
            aguardandoJogadores.classList.remove('hidden');
            
            // Atualiza a lista de jogadores
            atualizarListaJogadores(resposta.jogadores);
        } else {
            alert(resposta.mensagem);
        }
    });
});

function atualizarListaJogadores(jogadores) {
    listaJogadores.innerHTML = '';
    
    // Contagem de jogadores por casal
    const contagemA = jogadores.filter(j => j.casal === 'A').length;
    const contagemB = jogadores.filter(j => j.casal === 'B').length;

    jogadores.forEach(jogador => {
        const item = document.createElement('div');
        item.className = `item-jogador casal-${jogador.casal.toLowerCase()}`;
        item.textContent = `${jogador.casal === 'A' ? '💑' : '👫'} ${jogador.nome} - Casal ${jogador.casal}`;
        listaJogadores.appendChild(item);
    });

    // Atualiza o texto de espera
    const total = contagemA + contagemB;
    const texto = total < 4 
        ? `Aguardando ${4 - total} jogador(es)... (Casal A: ${contagemA}/2, Casal B: ${contagemB}/2)`
        : `Todos os 4 jogadores estão prontos! O jogo vai começar.`;
    document.querySelector('.aguardando-texto').textContent = texto;
}

// ===================================
// TELA DE PERGUNTAS
// ===================================

btnEu.addEventListener('click', () => {
    responder('Eu');
});

btnParceiro.addEventListener('click', () => {
    responder('Meu(a) Parceiro(a)');
});

function responder(resposta) {
    if (estadoCliente.respondeu) return;
    
    estadoCliente.respondeu = true;
    
    // Marca o botão como selecionado e desabilita
    btnEu.disabled = true;
    btnParceiro.disabled = true;
    
    if (resposta === 'Eu') {
        btnEu.classList.add('selecionado');
    } else {
        btnParceiro.classList.add('selecionado');
    }
    
    // Mostra o status de resposta
    statusResposta.classList.remove('hidden');
    textoStatusResposta.textContent = `✓ Você respondeu: ${resposta}`;
    
    // Envia a resposta para o servidor
    socket.emit('registrar-resposta', {
        salaId: estadoCliente.salaId,
        resposta: resposta
    });
}

// ===================================
// EVENTOS DO SOCKET.IO
// ===================================

// Atualização de jogadores
socket.on('jogadores-atualizados', (dados) => {
    atualizarListaJogadores(dados.jogadores);
});

// Jogo iniciado
socket.on('jogo-iniciado', (dados) => {
    estadoCliente.perguntaAtual = dados.perguntaIndex;
    estadoCliente.totalPerguntas = dados.totalPerguntas;
    
    mostrarTela(telaPerguntas);
    mostrarPergunta(dados.pergunta, dados.perguntaIndex, dados.totalPerguntas);
});

// Próxima pergunta
socket.on('proxima-pergunta', (dados) => {
    estadoCliente.perguntaAtual = dados.perguntaIndex;
    estadoCliente.respondeu = false;
    
    // Reseta os botões
    btnEu.classList.remove('selecionado');
    btnParceiro.classList.remove('selecionado');
    btnEu.disabled = false;
    btnParceiro.disabled = false;
    
    // Remove a animação de pontuação
    document.querySelectorAll('.placar-item').forEach(item => {
        item.classList.remove('pontuou');
    });
    
    // Oculta o status de resposta
    statusResposta.classList.add('hidden');
    
    // Oculta o feedback
    feedbackResultado.classList.add('hidden');
    
    mostrarPergunta(dados.pergunta, dados.perguntaIndex, dados.totalPerguntas);
});

// Jogador respondeu
socket.on('jogador-respondeu', (dados) => {
    // Pode ser usado para mostrar que outro jogador respondeu (opcional)
    // console.log(`${dados.jogadorNome} respondeu`);
});

// Resultado da pergunta
socket.on('resultado-pergunta', (dados) => {
    // Atualiza o placar
    estadoCliente.placarCasalA = dados.placarCasalA;
    estadoCliente.placarCasalB = dados.placarCasalB;
    
    placarCasalA.textContent = dados.placarCasalA;
    placarCasalB.textContent = dados.placarCasalB;
    
    // Anima o placar
    if (dados.casalAAcertou) {
        document.querySelector('.placar-item.casal-a').classList.add('pontuou');
    }
    if (dados.casalBAcertou) {
        document.querySelector('.placar-item.casal-b').classList.add('pontuou');
    }
    
    // Mostra feedback
    mostrarFeedback(dados.casalAAcertou || dados.casalBAcertou);
});

// Jogo finalizado
socket.on('jogo-finalizado', (dados) => {
    // Remove a animação de pontuação
    document.querySelectorAll('.placar-item').forEach(item => {
        item.classList.remove('pontuou');
    });
    
    // Determina o vencedor
    let texto = '';
    let mensagem = '';
    let emoji = '';
    
    if (dados.placarCasalA > dados.placarCasalB) {
        texto = 'Casal A Venceu! 🏆';
        mensagem = 'Parabéns! Vocês realmente se conhecem muito bem! O amor está no ar e a sintonia é perfeita.';
        emoji = '👑';
    } else if (dados.placarCasalB > dados.placarCasalA) {
        texto = 'Casal B Venceu! 🏆';
        mensagem = 'Parabéns! Vocês realmente se conhecem muito bem! O amor está no ar e a sintonia é perfeita.';
        emoji = '👑';
    } else {
        texto = 'Empate! 🤝';
        mensagem = 'Ambos os casais se conhecem igualmente bem! Um empate justo para o amor.';
        emoji = '💕';
    }
    
    textoResultado.textContent = texto;
    mensagemResultado.textContent = mensagem;
    placarFinalA.textContent = dados.placarCasalA;
    placarFinalB.textContent = dados.placarCasalB;
    document.querySelector('.emoji-resultado').textContent = emoji;
    
    mostrarTela(telaFinal);
});

// Jogo reiniciado
socket.on('jogo-reiniciado', (dados) => {
    estadoCliente.perguntaAtual = dados.perguntaIndex;
    estadoCliente.totalPerguntas = dados.totalPerguntas;
    estadoCliente.placarCasalA = 0;
    estadoCliente.placarCasalB = 0;
    estadoCliente.respondeu = false;
    
    placarCasalA.textContent = '0';
    placarCasalB.textContent = '0';
    
    // Reseta os botões
    btnEu.classList.remove('selecionado');
    btnParceiro.classList.remove('selecionado');
    btnEu.disabled = false;
    btnParceiro.disabled = false;
    
    // Oculta o status de resposta
    statusResposta.classList.add('hidden');
    
    // Oculta o feedback
    feedbackResultado.classList.add('hidden');
    
    mostrarTela(telaPerguntas);
    mostrarPergunta(dados.pergunta, dados.perguntaIndex, dados.totalPerguntas);
});

// ===================================
// FUNÇÕES AUXILIARES
// ===================================

function mostrarPergunta(pergunta, perguntaIndex, totalPerguntas) {
    perguntaTexto.textContent = pergunta;
    
    // Atualiza o progresso
    const progresso = (perguntaIndex / totalPerguntas) * 100;
    progressoBarra.style.width = progresso + '%';
    progressoTexto.textContent = `${perguntaIndex}/${totalPerguntas}`;
}

function mostrarFeedback(acertou) {
    feedbackResultado.classList.remove('hidden');
    
    if (acertou) {
        feedbackTexto.textContent = 'Que legal! 🎉 Ponto(s) marcado(s)!';
        feedbackEmoji.textContent = '✨';
        feedbackResultado.style.background = 'linear-gradient(135deg, #2ECC71 0%, #27AE60 100%)';
    } else {
        feedbackTexto.textContent = 'Quase lá! 😅 Ninguém pontuou.';
        feedbackEmoji.textContent = '💔';
        feedbackResultado.style.background = 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)';
    }

    // Adiciona a animação de popIn
    feedbackResultado.style.animation = 'popIn 0.5s ease forwards';

    // Remove a animação e oculta após um tempo (o servidor avança a pergunta)
    setTimeout(() => {
        feedbackResultado.style.animation = '';
        // Ocultar será feito no evento 'proxima-pergunta'
    }, 2000);
}

// ===================================
// BOTÃO NOVO JOGO
// ===================================

btnNovoJogo.addEventListener('click', () => {
    socket.emit('reiniciar-jogo', {
        salaId: estadoCliente.salaId
    });
});
\`\`\`
