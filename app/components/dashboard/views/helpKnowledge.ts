export type SocialRoute = "feed" | "profile" | "messages";

export interface HelpTopic {
  id: string;
  area: string;
  title: string;
  hint: string;
  keywords: string[];
  answer: string;
  steps: string[];
  targetLabel: string;
  targetView: string;
  socialRoute?: SocialRoute;
}

export interface HelpMatch {
  topic: HelpTopic;
  score: number;
}

export const normalizeHelpText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const helpTopics: HelpTopic[] = [
  {
    id: "painel-principal",
    area: "Painel",
    title: "Entender o painel principal",
    hint: "cards, menu, atalhos, Meu Perfil e navegação",
    keywords: ["painel", "dashboard", "inicio", "home", "menu", "card", "atalho", "principal"],
    answer: "O painel principal concentra os atalhos do app: Social, Comunidades, Treinos, Nutrição, Evolução, Meu Perfil, Ajuda e Sugestões. No celular, use a navegação inferior; no desktop, use a lateral e os cards.",
    steps: ["Abra o Painel pelo menu inferior ou lateral.", "Escolha o card da funcionalidade que deseja usar.", "No celular, arraste a barra inferior se quiser ver todos os atalhos.", "Use o botão Voltar das telas internas para retornar ao painel."],
    targetLabel: "Abrir painel",
    targetView: "home",
  },
  {
    id: "meu-perfil-interno",
    area: "Meu Perfil",
    title: "Completar Meu Perfil privado",
    hint: "dados do cargo, avaliações, medidas e histórico",
    keywords: ["meu perfil", "perfil interno", "perfil privado", "dados do cargo", "avaliacao", "avaliação", "anamnese", "par-q", "rfm", "medidas", "antropometria"],
    answer: "Meu Perfil é a área privada para dados do cargo, objetivo, rotina, restrições e avaliações opcionais. Ele não substitui o perfil social e serve para melhorar treinos, nutrição e evolução.",
    steps: ["Abra Meu Perfil pelo avatar, pelo card do painel ou pela barra inferior no celular.", "Complete Dados do cargo com informações do seu perfil.", "Use Avaliações para registrar medidas opcionais.", "Confira o Histórico quando salvar novas avaliações."],
    targetLabel: "Abrir Meu Perfil",
    targetView: "perfil",
  },
  {
    id: "notificacoes",
    area: "Painel",
    title: "Ver notificações",
    hint: "sino, avisos, mensagens e aprovações",
    keywords: ["notificacao", "notificacoes", "sino", "aviso", "alerta", "aprovado", "aprovacao", "pedido"],
    answer: "As notificações aparecem no sino do topo e levam direto para a área relacionada, como mensagens, social, treino ou comunidade.",
    steps: ["Toque no sino no topo do painel.", "Leia os avisos pendentes.", "Toque em uma notificação para abrir a tela correta automaticamente."],
    targetLabel: "Abrir painel",
    targetView: "home",
  },
  {
    id: "beta",
    area: "Beta",
    title: "Entender o aviso de beta",
    hint: "testes, melhorias e instabilidade",
    keywords: ["beta", "teste", "testes", "versao", "instavel", "aviso", "experimento"],
    answer: "O aviso de beta informa que o app está em fase de testes. Isso ajuda o usuário a saber que melhorias, ajustes e correções ainda estão acontecendo.",
    steps: ["Use o app normalmente.", "Se algo falhar, registre pela aba Sugestões.", "Inclua a tela, o que tentou fazer e o que aconteceu."],
    targetLabel: "Enviar sugestão",
    targetView: "sugestoes",
  },
  {
    id: "ajuda-voz",
    area: "Ajuda",
    title: "Usar ajuda por voz",
    hint: "microfone, ditado e leitura",
    keywords: ["voz", "áudio", "áudio", "microfone", "falar", "ouvir", "ditado", "ler"],
    answer: "A Ajuda aceita dúvida digitada ou falada. Também pode ler a orientação em voz alta quando o navegador permitir.",
    steps: ["Abra Ajuda.", "Digite sua dúvida ou toque em Falar.", "Depois toque em Ouvir se quiser escutar a resposta."],
    targetLabel: "Abrir ajuda",
    targetView: "ajuda",
  },
  {
    id: "sugestoes",
    area: "Beta",
    title: "Enviar sugestão ou bug",
    hint: "feedback, melhoria, erro e ideia",
    keywords: ["sugestão", "sugestão", "feedback", "melhoria", "ideia", "bug", "erro", "problema", "travou"],
    answer: "A aba Sugestões serve para registrar ideias, bugs e melhorias durante o beta. Se a dúvida virar problema real, envie por lá.",
    steps: ["Abra Sugestões.", "Escolha o tipo de relato.", "Explique onde aconteceu e como reproduzir.", "Envie para ficar registrado."],
    targetLabel: "Abrir sugestões",
    targetView: "sugestoes",
  },
  {
    id: "social-feed",
    area: "Ativora Social",
    title: "Postar no Ativora Social",
    hint: "texto, mídia, enquete e resultado",
    keywords: ["social", "feed", "post", "postar", "publicar", "foto", "video", "vídeo", "midia", "mídia", "enquete", "resultado"],
    answer: "No Ativora Social você publica texto, mídia, resultados e enquetes no feed. Revise antes de publicar para evitar posts incompletos.",
    steps: ["Abra Ativora Social.", "Use o campo de publicação no topo do feed.", "Escolha texto, imagem, vídeo ou enquete.", "Revise e publique."],
    targetLabel: "Abrir Social",
    targetView: "social",
    socialRoute: "feed",
  },
  {
    id: "social-comentarios",
    area: "Ativora Social",
    title: "Comentar, curtir, salvar ou apagar",
    hint: "interações e controle do próprio conteúdo",
    keywords: ["comentario", "comentário", "comentar", "curtir", "like", "salvar", "apagar", "deletar", "remover", "excluir"],
    answer: "No feed você pode interagir com posts e comentários. O próprio autor deve conseguir apagar o que publicou; se algo não aparecer, registre como bug.",
    steps: ["Abra o post no Ativora Social.", "Use os botões de curtir, comentar ou salvar.", "Para apagar, use a ação do seu próprio post ou comentário."],
    targetLabel: "Abrir feed",
    targetView: "social",
    socialRoute: "feed",
  },
  {
    id: "social-stories",
    area: "Ativora Social",
    title: "Ver e publicar stories",
    hint: "stories, atualizações rápidas e mídia",
    keywords: ["story", "stories", "status", "storie", "temporario", "temporário"],
    answer: "Os stories ficam no topo do Ativora Social para atualizações rápidas. Use mídia clara e curta para resultados, bastidores e avisos.",
    steps: ["Abra Ativora Social.", "Use a área de stories no topo.", "Toque para visualizar ou criar um story.", "Publique e confira se apareceu na fila."],
    targetLabel: "Abrir stories",
    targetView: "social",
    socialRoute: "feed",
  },
  {
    id: "social-direct",
    area: "Ativora Social",
    title: "Usar mensagens estilo direct",
    hint: "chat, conversa privada e mensagens",
    keywords: ["mensagem", "mensagens", "direct", "dm", "chat", "conversa", "privado", "inbox"],
    answer: "As mensagens funcionam como um direct: você abre a aba Mensagens, escolhe uma conversa e responde sem sair do app.",
    steps: ["Abra Ativora Social.", "Entre na aba Mensagens.", "Escolha uma conversa ou procure um usuário.", "Digite e envie a mensagem."],
    targetLabel: "Abrir mensagens",
    targetView: "social",
    socialRoute: "messages",
  },
  {
    id: "social-perfil",
    area: "Ativora Social",
    title: "Editar e revisar meu perfil",
    hint: "bio, posts, dados e aparência",
    keywords: ["perfil", "meu perfil", "bio", "avatar", "foto", "usuario", "usuário", "nickname"],
    answer: "O perfil reúne seus posts, dados sociais e identidade dentro do Ativora Social. É a vitrine do aluno no app.",
    steps: ["Abra Ativora Social.", "Entre em Meu Perfil.", "Revise foto, nome, bio e publicações.", "Ajuste o que estiver incompleto."],
    targetLabel: "Abrir perfil",
    targetView: "social",
    socialRoute: "profile",
  },
  {
    id: "comunidades-entrada",
    area: "Comunidades",
    title: "Solicitar entrada em uma comunidade",
    hint: "grupos fechados e aprovação",
    keywords: ["comunidade", "comunidades", "grupo", "entrar", "solicitar", "pedido", "pendente", "aprovar", "recusar"],
    answer: "As comunidades são grupos fechados. Você solicita entrada, o dono ou ADM analisa e, se aprovado, você entra como Participante.",
    steps: ["Abra Comunidades.", "Escolha a comunidade desejada.", "Toque em Solicitar entrada.", "Acompanhe o status da solicitação."],
    targetLabel: "Abrir comunidades",
    targetView: "comunidades",
  },
  {
    id: "comunidades-tags",
    area: "Comunidades",
    title: "Entender tags e permissões",
    hint: "Participante, Nutri, Instrutor, ADM e Dono",
    keywords: ["tag", "tags", "participante", "nutri", "instrutor", "personal", "adm", "admin", "dono", "permissao", "permissão"],
    answer: "Todo membro entra como Participante. O dono pode atribuir tags adicionais, como Nutri, Instrutor ou ADM, para liberar painéis e permissões específicas.",
    steps: ["Entre no hub da comunidade.", "Abra a área de membros ou administração.", "Revise as tags de cada pessoa.", "O dono ajusta as permissões quando necessário."],
    targetLabel: "Abrir comunidades",
    targetView: "comunidades",
  },
  {
    id: "comunidades-treinos",
    area: "Comunidades",
    title: "Treinos dentro da comunidade",
    hint: "cronograma, PDF e solicitação ao instrutor",
    keywords: ["treino comunidade", "treinos comunidade", "cronograma", "pdf treino", "baixar treino", "solicitar treino", "instrutor", "personal"],
    answer: "Na área Treinos da comunidade o aluno vê o cronograma semanal, solicita plano e pode baixar PDF offline quando houver treino publicado.",
    steps: ["Abra Comunidades e entre no grupo.", "Acesse a aba Treinos.", "Veja o treino por dia ou solicite um novo plano.", "Use Baixar PDF para guardar offline."],
    targetLabel: "Abrir comunidades",
    targetView: "comunidades",
  },
  {
    id: "comunidades-nutricao",
    area: "Comunidades",
    title: "Nutrição dentro da comunidade",
    hint: "cardápio, avaliação RFM e PDF",
    keywords: ["nutrição comunidade", "nutrição comunidade", "cardápio comunidade", "cardápio comunidade", "pdf cardápio", "baixar cardápio", "rfm comunidade"],
    answer: "Na área Nutrição da comunidade o aluno solicita cardápio, preenche avaliação rápida RFM e baixa o PDF do cardápio semanal quando publicado.",
    steps: ["Entre na comunidade.", "Abra a aba Nutrição.", "Preencha objetivo, altura, cintura e dados básicos.", "Acompanhe o status e baixe o PDF quando disponível."],
    targetLabel: "Abrir comunidades",
    targetView: "comunidades",
  },
  {
    id: "comunidades-desafios",
    area: "Comunidades",
    title: "Enviar desafios da semana",
    hint: "missões, foto, vídeo, texto e aprovação",
    keywords: ["desafio", "desafios", "missao", "missão", "envio", "prova", "foto desafio", "video desafio", "aprovar desafio"],
    answer: "Os desafios geram engajamento e pontos. O participante envia o que foi pedido e o ADM ou dono aprova, reprova ou pede reenvio.",
    steps: ["Entre na comunidade.", "Abra Desafios da Semana.", "Escolha o desafio ativo.", "Envie foto, vídeo, link, texto ou arquivo conforme solicitado."],
    targetLabel: "Abrir comunidades",
    targetView: "comunidades",
  },
  {
    id: "comunidades-ranking",
    area: "Comunidades",
    title: "Ver ranking semanal e selos",
    hint: "pontuação, posição e recompensas",
    keywords: ["ranking", "classificacao", "classificação", "pontos", "pontuacao", "pontuação", "selo", "selos", "recompensa", "campeao"],
    answer: "O ranking semanal soma pontos de atividades aprovadas. Selos aparecem conforme constância, desafios, treinos, nutrição e vitórias semanais.",
    steps: ["Entre na comunidade.", "Abra Ranking Semanal.", "Veja sua posição, pontos e selos.", "Complete desafios aprovados para subir."],
    targetLabel: "Abrir comunidades",
    targetView: "comunidades",
  },
  {
    id: "comunidades-admin",
    area: "Comunidades",
    title: "Administrar comunidade",
    hint: "membros, pedidos, tags e conteúdos",
    keywords: ["administrar", "administracao", "administração", "painel admin", "aprovar membro", "membros", "gerenciar", "moderar", "dono"],
    answer: "Dono e ADMs gerenciam pedidos, membros, desafios e conteúdos conforme permissões. O dono mantém controle total da comunidade.",
    steps: ["Entre na comunidade como Dono ou ADM.", "Abra o painel administrativo.", "Analise pedidos, membros e conteúdos.", "Aplique tags ou permissões com cuidado."],
    targetLabel: "Abrir comunidades",
    targetView: "comunidades",
  },
  {
    id: "treinos-principal",
    area: "Treinos",
    title: "Usar a aba Treinos",
    hint: "treinos do app, comunidades e guia",
    keywords: ["treino", "treinos", "aba treinos", "meus treinos", "executar treino", "concluir treino"],
    answer: "A aba Treinos reúne acesso ao guia de exercícios e aos treinos vindos das funcionalidades do app, começando por AtivoraComunidades.",
    steps: ["Abra Treinos.", "Escolha Guia de treinos para aprender execução.", "Use AtivoraComunidades para treinos de grupos.", "Conclua treinos quando estiverem disponíveis."],
    targetLabel: "Abrir treinos",
    targetView: "treinos",
  },
  {
    id: "guia-exercicios",
    area: "Treinos",
    title: "Aprender um exercício no guia",
    hint: "busca, superiores, inferiores e vídeo",
    keywords: ["exercicio", "exercício", "exercicios", "exercícios", "guia", "execucao", "execução", "video exercicio", "superiores", "inferiores"],
    answer: "O Guia de treinos permite buscar exercícios, filtrar por superiores ou inferiores e assistir ao vídeo dentro do player do app.",
    steps: ["Abra Treinos.", "Toque no card Guia de treinos.", "Use a lupa ou os filtros.", "Abra o exercício para ver posição, cuidados e vídeo."],
    targetLabel: "Abrir guia",
    targetView: "treinos",
  },
  {
    id: "nutricao-principal",
    area: "Nutrição",
    title: "Usar a aba Nutrição",
    hint: "cardápios, funcionalidades e avaliação",
    keywords: ["nutricao", "nutrição", "nutri", "cardapio", "cardápio", "refeicao", "refeição", "dieta"],
    answer: "A aba Nutrição reúne cardápios por funcionalidade do app. Por enquanto, o foco é AtivoraComunidades, com avaliação rápida e cardápios semanais.",
    steps: ["Abra Nutrição.", "Escolha AtivoraComunidades.", "Confira cardápios e solicitações.", "Use a avaliação rápida para apoiar o pedido nutricional."],
    targetLabel: "Abrir nutrição",
    targetView: "nutricao",
  },
  {
    id: "nutricao-rfm",
    area: "Nutrição",
    title: "Fazer avaliação rápida RFM",
    hint: "altura, cintura, sexo e estimativa",
    keywords: ["rfm", "gordura", "massa gorda", "cintura", "altura", "avaliacao", "avaliação", "medida", "medidas", "imc", "peso"],
    answer: "A avaliação RFM estima gordura corporal com altura e cintura. É um apoio para conversa com profissional, nunca diagnóstico clínico absoluto.",
    steps: ["Abra Nutrição ou Nutrição da comunidade.", "Informe sexo biológico, altura, peso e cintura.", "Leia a estimativa com responsabilidade.", "Envie para revisão profissional se for solicitar cardápio."],
    targetLabel: "Abrir nutrição",
    targetView: "nutricao",
  },
  {
    id: "evolucao",
    area: "Evolução",
    title: "Acompanhar evolução",
    hint: "medidas, progresso, fotos e histórico",
    keywords: ["evolucao", "evolução", "metricas", "métricas", "progresso", "histórico", "histórico", "medidas", "foto comparativa", "resultado"],
    answer: "A área Evolução reúne medidas do Meu Perfil, constância de treinos, cardápios seguidos, desafios aprovados e histórico das comunidades.",
    steps: ["Abra Evolução pelo painel.", "Revise medidas, constância e histórico de comunidades.", "Atualize Meu Perfil quando quiser que novas medidas apareçam como referência.", "Use Sugestões para pedir gráficos ou métricas extras."],
    targetLabel: "Abrir evolução",
    targetView: "metricas",
  },
  {
    id: "ajustes",
    area: "Ajustes",
    title: "Configurar conta e preferências",
    hint: "perfil, segurança, privacidade e sessão",
    keywords: ["config", "configuracao", "configuração", "ajuste", "ajustes", "conta", "senha", "privacidade", "seguranca", "segurança", "sair", "logout"],
    answer: "A área Ajustes reúne preferências de conta, privacidade, notificações e segurança. No beta, ela serve como painel base para essas configurações.",
    steps: ["Abra Ajustes pelo menu.", "Revise dados da conta e preferências.", "Use Sugestões se faltar alguma opção importante."],
    targetLabel: "Abrir ajustes",
    targetView: "config",
  },
  {
    id: "login-cadastro",
    area: "Acesso",
    title: "Entrar, cadastrar ou recuperar acesso",
    hint: "login, cadastro, senha e conta",
    keywords: ["login", "entrar", "cadastro", "cadastrar", "registrar", "senha", "recuperar", "acesso", "conta"],
    answer: "Problemas de acesso geralmente envolvem login, cadastro ou sessão. Se você já está dentro do app, registre detalhes pela aba Sugestões para a equipe corrigir o fluxo.",
    steps: ["Confira se o e-mail e senha estão corretos.", "Se estiver dentro do app, abra Sugestões.", "Informe o tipo de conta, tela e mensagem de erro."],
    targetLabel: "Enviar relato",
    targetView: "sugestoes",
  },
  {
    id: "mobile-desktop",
    area: "Suporte",
    title: "Resolver problema de layout no celular ou desktop",
    hint: "tela cortada, botão sumido e responsividade",
    keywords: ["celular", "smartphone", "mobile", "desktop", "computador", "responsivo", "cortado", "sumiu", "botao", "botão", "layout", "travado"],
    answer: "Se algum botão sumir, a tela cortar ou algo ficar difícil no celular ou desktop, use a aba Sugestões com o máximo de detalhes. Isso vira correção prioritária do beta.",
    steps: ["Anote a tela onde aconteceu.", "Informe se foi celular ou desktop.", "Descreva o botão ou conteúdo afetado.", "Envie pela aba Sugestões."],
    targetLabel: "Abrir sugestões",
    targetView: "sugestoes",
  },
];

export const genericHelpTopic: HelpTopic = {
  id: "orientação-geral",
  area: "Ajuda",
  title: "Orientação geral do app",
  hint: "caminho seguro para qualquer dúvida",
  keywords: [],
  answer: "Vou te levar pelo caminho mais seguro: se a dúvida é sobre usar uma função, comece pelo painel e escolha a área relacionada. Se for erro, bug, botão sumido ou melhoria, registre em Sugestões para o beta.",
  steps: ["Identifique a área mais próxima: Social, Comunidades, Treinos, Nutrição, Evolução ou Ajustes.", "Use o botão abaixo para ir ao Painel e escolher a função.", "Se ainda não resolver, envie o relato em Sugestões com a tela e o que aconteceu."],
  targetLabel: "Abrir painel",
  targetView: "home",
};

function topicScore(topic: HelpTopic, question: string) {
  const normalizedQuestion = normalizeHelpText(question);
  const searchable = normalizeHelpText(`${topic.area} ${topic.title} ${topic.hint} ${topic.answer}`);
  const keywordScore = topic.keywords.reduce((total, keyword) => (
    normalizedQuestion.includes(normalizeHelpText(keyword)) ? total + 4 : total
  ), 0);
  const wordScore = normalizedQuestion
    .split(/\s+/)
    .filter(word => word.length > 2 && searchable.includes(word))
    .length;

  return keywordScore + wordScore;
}

export function getHelpMatches(question: string): HelpMatch[] {
  if (!question.trim()) {
    return helpTopics.slice(0, 12).map((topic, index) => ({ topic, score: 12 - index }));
  }

  const scored = helpTopics
    .map(topic => ({ topic, score: topicScore(topic, question) }))
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.length ? scored : [{ topic: genericHelpTopic, score: 1 }];
}
