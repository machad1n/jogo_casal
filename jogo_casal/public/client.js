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
    const salaId = inputSalaId.value.trim();
    if (!salaId) {
        alert('Por favor, insira o código da sala');
        return;
    }
    
    estadoCliente.salaId = salaId;
    mostrarTela(telaCadastro);
    codigoSala.textContent = `Código da Sala: ${salaId}`;
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
    
    // Envia os dados para o servidor
    socket.emit('criar-ou-entrar-sala', {
        salaId: estadoCliente.salaId,
        nome: nome,
        casal: casal
    }, (resposta) => {
        if (resposta.sucesso) {
            estadoCliente.jogadorId = resposta.salaId; // Será atualizado pelo servidor
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
    jogadores.forEach(jogador => {
        const item = document.createElement('div');
        item.className = `item-jogador casal-${jogador.casal.toLowerCase()}`;
        item.textContent = `${jogador.casal === 'A' ? '💑' : '👫'} ${jogador.nome} - Casal ${jogador.casal}`;
        listaJogadores.appendChild(item);
    });
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
    
    // Marca o botão como selecionado
    if (resposta === 'Eu') {
        btnEu.classList.add('selecionado');
        btnParceiro.disabled = true;
    } else {
        btnParceiro.classList.add('selecionado');
        btnEu.disabled = true;
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
    
    // Oculta o status de resposta
    statusResposta.classList.add('hidden');
    
    // Oculta o feedback
    feedbackResultado.classList.add('hidden');
    
    mostrarPergunta(dados.pergunta, dados.perguntaIndex, dados.totalPerguntas);
});

// Jogador respondeu
socket.on('jogador-respondeu', (dados) => {
    // Pode ser usado para mostrar que outro jogador respondeu
    console.log(`${dados.jogadorNome} respondeu`);
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
    if (dados.casalAAcertou || dados.casalBAcertou) {
        mostrarFeedback(true);
    } else {
        mostrarFeedback(false);
    }
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
}

// ===================================
// BOTÃO NOVO JOGO
// ===================================

btnNovoJogo.addEventListener('click', () => {
    socket.emit('reiniciar-jogo', {
        salaId: estadoCliente.salaId
    });
});
