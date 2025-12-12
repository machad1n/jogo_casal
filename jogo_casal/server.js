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
    return 'sala-' + Math.random().toString(36).substr(2, 9);
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
        
        // Se não houver salaId, cria uma nova
        let idSala = salaId;
        if (!idSala) {
            idSala = gerarIdSala();
            inicializarSala(idSala);
            console.log(`Sala criada: ${idSala}`);
        }
        
        // Verifica se a sala existe
        if (!estadoGlobal.salas[idSala]) {
            inicializarSala(idSala);
        }
        
        const sala = estadoGlobal.salas[idSala];
        
        // Verifica se a sala está cheia
        if (Object.keys(sala.jogadores).length >= 4) {
            callback({ sucesso: false, mensagem: 'Sala cheia!' });
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
        
        console.log(`Jogador ${nome} entrou na sala ${idSala}`);
        
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
    });
    
    // ===================================
    // EVENTO: Registrar Resposta
    // ===================================
    socket.on('registrar-resposta', (dados) => {
        const { salaId, resposta } = dados;
        const sala = estadoGlobal.salas[salaId];
        
        if (!sala) {
            console.log(`Sala ${salaId} não encontrada`);
            return;
        }
        
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
            io.to(salaId).emit('resultado-pergunta', {
                casalAAcertou: resultado.casalAAcertou,
                casalBAcertou: resultado.casalBAcertou,
                placarCasalA: resultado.placarCasalA,
                placarCasalB: resultado.placarCasalB
            });
            
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
                delete sala.jogadores[socket.id];
                console.log(`Jogador removido da sala ${salaId}`);
                
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

const PORT = process.env.PORT || 10000; 
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
