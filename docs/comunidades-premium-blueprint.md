# Ativora Comunidades Premium - Blueprint de Produto e Arquitetura

## Diagnostico do projeto atual

O modulo Comunidades ja possui uma base real no projeto:

- Front-end: `CommunityList`, `CommunityHub`, `CommunityGestao`, `CommunityTreinos`, `CommunityNutricao`, `CommunityDesafios`, `CommunityRanking`, `NotificationsPanel`.
- APIs: `/api/communities`, `/api/communities/[id]`, `requests`, `members`, `treinos`, `desafios`, `ranking`, `notifications`, `medidas`, `document-import`.
- Banco atual principal: `comunidades`, `comunidade_membros`, `comunidade_tags`, `comunidade_membro_tags`, `solicitacoes_entrada`, `treinos`, `exercicios_treino`, `solicitacoes_treino`, `cardapios`, `refeicoes_cardapio`, `solicitacoes_nutricionais`, `desafios`, `entregas_desafios`, `ranking_semanal`, `selos`, `usuario_selos`, `notificacoes_comunidade`, `medidas_corporais`.

Problema central: a base existe, mas esta fragmentada e ainda falta camada de produto para virar um modulo premium: regras/configuracoes, permissoes granulares, auditoria, historico de revisoes, anexos estruturados, ranking fechado por semana, eventos de desafio, logs de IA e UX mobile-first unificada.

## Visao de produto

Comunidades deve ser o modulo central de acompanhamento coletivo e semi-individual do app fitness. Nao deve parecer um forum publico. Deve parecer uma area fechada de mentoria, metodologia, acompanhamento, desafios e entregas.

Principios:

- Entrada por solicitacao, nunca entrada publica automatica.
- Hub interno como "central operacional" da comunidade.
- Conteudo validado por profissional antes de publicar.
- IA como assistente produtivo, nao como decisora final.
- Gamificacao forte: desafios, XP semanal, ranking, selos e historico.
- Mobile-first com experiencia de app nativo.
- Desktop com dashboards amplos, paineis laterais e grids densos.

## Navegacao sugerida

Entrada:

1. Lista de comunidades.
2. Card da comunidade com capa, nome, foco, total de membros, status da entrada.
3. CTA: `Solicitar entrada`, `Pendente`, `Entrar no hub`, `Recusado`.
4. A solicitacao vai para Dono/ADM.
5. Ao aprovar, cria/atualiza `comunidade_membros` como `aprovado` e adiciona tag `Participante`.

Hub interno:

- Visao Geral
- Treinos
- Nutricao
- Desafios
- Ranking
- Evolucao
- Membros
- Notificacoes
- Gestao, visivel para Dono/ADM

Mobile:

- Header fixo compacto com capa degradada.
- Tabs horizontais com scroll e icones.
- Cards empilhados.
- Acoes principais em botoes grandes de toque.
- Modais complexos viram bottom sheets/drawers.

Desktop:

- Header hero compacto + grid de indicadores.
- Navegacao lateral interna ou tabs largas.
- Dashboard em 12 colunas.
- Paineis lado a lado: ranking, notificacoes, proximas missoes.
- Tabelas viram listas responsivas no mobile.

## Fluxos por perfil

Participante:

- Solicita entrada.
- Acessa hub apos aprovacao.
- Ve treino semanal, cardapio, desafios, ranking, selos e notificacoes.
- Solicita treino e cardapio.
- Envia medidas simples.
- Conclui treino, marca refeicoes, envia desafios.

Nutri:

- Recebe notificacoes de solicitacoes nutricionais.
- Abre dados do aluno, historico de medidas e objetivo.
- Usa IA para rascunho de cardapio.
- Edita tudo manualmente.
- Publica para aluno especifico.
- Acompanha evolucao nutricional.

Instrutor/Personal:

- Recebe solicitacoes de treino.
- Usa IA para rascunho de treino.
- Edita, duplica, organiza semana, adiciona videos e links.
- Publica para todos, grupo ou aluno especifico.
- Acompanha execucoes.

ADM:

- Aprova/recusa entrada.
- Cria e avalia desafios.
- Modera membros conforme permissao.
- Acompanha ranking, notificacoes e metricas.
- Nao deve ter poder total por padrao; o Dono configura.

Dono:

- Controle total.
- Configura comunidade, regras, tags, permissoes de ADM.
- Gerencia membros, tags, conteudo, ranking, selos e metricas.
- Pode editar treinos, nutricao, desafios e configuracoes.

## Permissoes

Modelo recomendado:

- Dono: tudo.
- ADM: permissao por chave, configuravel pelo Dono.
- Nutri: nutricao, medidas, solicitacoes nutricionais, cardapios, IA nutricional.
- Instrutor/Personal: treinos, solicitacoes de treino, execucoes, IA de treino.
- Participante: consumo, solicitacoes, entregas, conclusoes e leitura.

Chaves de permissao:

- `member.approve`
- `member.remove`
- `member.tag.assign`
- `community.edit`
- `challenge.create`
- `challenge.evaluate`
- `ranking.close`
- `workout.create`
- `workout.publish`
- `nutrition.create`
- `nutrition.publish`
- `notification.broadcast`
- `settings.manage`

## Hub premium

Cards principais:

- Treino da semana: status, proximo treino, progresso.
- Nutricao da semana: cardapio publicado, refeicoes de hoje, progresso.
- Desafios de hoje: ativos, pendentes, enviados, aprovados.
- Ranking semanal: posicao, XP, diferenca para o proximo.
- Selo atual: selo principal e sequencia.
- Solicitacoes: treino/nutricao pendentes ou em andamento.
- Notificacoes recentes.
- Membros em destaque.

Estados vazios:

- Sem treino: "Nenhum treino publicado para voce ainda."
- Sem cardapio: "Nenhum cardapio publicado para esta semana."
- Sem desafio: "Hoje esta livre. Volte depois para novas missoes."
- Sem ranking: "O ranking comeca quando os primeiros desafios forem aprovados."

## Treinos

Aluno:

- Semana em cards por dia.
- Treino detalhado: grupo, exercicio, series, repeticoes, descanso, obs, video, link externo.
- Marcar treino concluido.
- Historico por semana.

Profissional:

- Criar do zero.
- Duplicar treino.
- Importar PDF/imagem.
- Usar IA como rascunho.
- Editar antes de publicar.
- Publicar para todos, grupo ou aluno.
- Anexar video proprio e link externo.

IA de treino:

- Entrada: foco, nivel, restricoes, dias disponiveis, objetivo, historico.
- Saida: rascunho estruturado.
- Status: `draft_ai`.
- Obrigatorio: profissional revisa e publica.
- Guardar log em `ia_execucoes`.

## Nutricao

Aluno:

- Solicitar cardapio.
- Informar foco, objetivo, restricoes, preferencias, dados basicos e medidas simples.
- Medidas: peso, altura, cintura, quadril, pescoco opcional, sexo biologico para formula.
- Ver estimativa como apoio, com aviso claro.
- Receber cardapio semanal por dia/refeicao.
- Marcar refeicoes concluidas.

Profissional:

- Recebe fila de solicitacoes.
- Abre historico de medidas.
- Usa IA para rascunho.
- Edita refeicoes, alimentos, macros, orientacoes.
- Publica para aluno especifico.

Comunicacao responsavel da estimativa:

- Texto fixo: "Estimativa matematica de apoio para acompanhamento remoto. Nao substitui bioimpedancia, avaliacao presencial ou diagnostico clinico. A decisao final e do profissional."
- Mostrar metodologia usada: Navy/RCQ/IMC apoio.
- Mostrar margem qualitativa, nao prometer precisao absoluta.
- Permitir revisao manual pelo profissional.

## Desafios da Semana

Desafio:

- titulo
- descricao
- instrucoes
- tipo_envio: check, foto, video, texto, link, arquivo
- xp_recompensa
- dia_semana
- prazo
- criterio_avaliacao
- aprovador_responsavel opcional
- status

Entrega:

- participante envia conteudo e/ou arquivos.
- status: pendente, em_analise, aprovado, reprovado, reenvio.
- ADM/Dono avalia.
- XP so entra quando status vira aprovado.
- Todo reenvio gera evento historico.

## Ranking semanal

Pontuacao:

- Desafio aprovado: XP do desafio.
- Treino concluido: XP opcional menor, se configurado.
- Refeicoes/cardapio em dia: XP opcional, se configurado.

Regra de fechamento:

- Semana: segunda 00:00 ate domingo 23:59:59.
- Fechamento: domingo 23:59 ou segunda 00:05 por cron.
- Ordenacao: maior `xp_total`, maior `desafios_ok`, menor `reprovacoes`, menor timestamp da ultima aprovacao decisiva.
- Empate persistente: mesma posicao visual ou desempate por quem chegou primeiro.
- Vencedor recebe `campeao_semana`.
- Ranking da nova semana inicia zerado, historico permanece em snapshot.

## Selos

Selos automaticos:

- Campeao da Semana: 1o lugar no fechamento.
- Constancia Maxima: 7 dias com atividade aprovada/concluida.
- Nutri em Dia: refeicoes/cardapio completos na semana.
- Treino Completo: treinos previstos concluidos.
- Desafio Perfeito: 100% desafios aprovados sem reenvio.
- Sequencia 4 Semanas: atividade consistente por 4 semanas.
- Top Participante: top 3 por 3 semanas.

Selos devem aparecer:

- Perfil do membro dentro da comunidade.
- Ranking.
- Historico.
- Notificacao.

## Notificacoes internas

Tipos:

- entrada_aprovada
- entrada_recusada
- solicitacao_entrada
- solicitacao_treino
- solicitacao_nutricao
- novo_treino
- novo_cardapio
- novo_desafio
- desafio_aprovado
- desafio_reprovado
- desafio_reenvio
- subiu_ranking
- novo_selo
- campeao_semana

Segmentacao:

- Nutri: solicitacoes nutricionais.
- Instrutor/Personal: solicitacoes de treino.
- ADM/Dono: entradas, entregas, ranking, alertas.
- Participante: conteudo publicado, status, selos, ranking.

## APIs sugeridas

Comunidades:

- `GET /api/communities`
- `POST /api/communities`
- `GET /api/communities/:id`
- `PATCH /api/communities/:id`
- `GET /api/communities/:id/dashboard`
- `GET /api/communities/:id/members`
- `PATCH /api/communities/:id/members/:memberId/tags`
- `GET /api/communities/:id/requests`
- `POST /api/communities/:id/requests`
- `PATCH /api/communities/:id/requests/:requestId`

Treinos:

- `GET /api/communities/:id/workouts`
- `POST /api/communities/:id/workouts`
- `PATCH /api/communities/:id/workouts/:workoutId`
- `DELETE /api/communities/:id/workouts/:workoutId`
- `POST /api/communities/:id/workout-requests`
- `POST /api/communities/:id/workout-requests/:requestId/ai-draft`
- `POST /api/communities/:id/workouts/:workoutId/publish`
- `POST /api/communities/:id/workouts/:workoutId/complete`

Nutricao:

- `GET /api/communities/:id/nutrition/plans`
- `POST /api/communities/:id/nutrition/requests`
- `POST /api/communities/:id/nutrition/requests/:requestId/ai-draft`
- `POST /api/communities/:id/nutrition/plans`
- `PATCH /api/communities/:id/nutrition/plans/:planId`
- `POST /api/communities/:id/nutrition/plans/:planId/publish`
- `POST /api/communities/:id/measurements`

Desafios/ranking:

- `GET /api/communities/:id/challenges`
- `POST /api/communities/:id/challenges`
- `POST /api/communities/:id/challenges/:challengeId/submissions`
- `PATCH /api/communities/:id/challenge-submissions/:submissionId/review`
- `GET /api/communities/:id/ranking`
- `POST /api/communities/:id/ranking/close-week`

IA/documentos:

- `POST /api/communities/:id/document-import`
- `POST /api/communities/:id/ai/workout`
- `POST /api/communities/:id/ai/nutrition`

## Componentes front-end

- `CommunityShell`
- `CommunityHeader`
- `CommunityTabs`
- `CommunityMobileNav`
- `CommunityDashboard`
- `MetricCard`
- `WeeklyTimeline`
- `WorkoutWeekBoard`
- `WorkoutEditorDrawer`
- `NutritionRequestForm`
- `NutritionPlanEditor`
- `BodyMeasureForm`
- `BodyEstimateCard`
- `ChallengeBoard`
- `ChallengeSubmissionDrawer`
- `RankingPodium`
- `RankingTableResponsive`
- `MemberTagManager`
- `NotificationInbox`
- `AdminPermissionsPanel`

## Ordem ideal de desenvolvimento

MVP premium:

1. Normalizar banco atual e aplicar SQL faltante.
2. Entrada por solicitacao com Participante automatico.
3. Hub responsivo com dados reais.
4. Treinos: aluno + profissional + IA rascunho + publicar.
5. Nutricao: solicitacao + medidas + IA rascunho + publicar.
6. Desafios: criar, enviar, avaliar, pontuar.
7. Ranking semanal e notificacoes.

Fase 2:

1. Permissoes granulares por ADM.
2. Historico completo de tags, avaliacoes e reenvios.
3. Selos automaticos completos.
4. Snapshots semanais e tela de historico.
5. Upload estruturado de arquivos por desafio/treino/cardapio.

Fase 3:

1. Tempo real via polling inteligente, SSE ou WebSocket.
2. Beneficios destravados por selos.
3. Relatorios para Dono.
4. Templates de treino/cardapio/desafios.
5. Multi-profissionais por grupo com atribuicao de alunos.

## SQL faltando

Ver arquivo: `docs/comunidades-premium-sql-faltante.sql`.

Resumo do que falta/refinar:

- `treinos.dia_rotulo` para preservar "Dia 1", datas e nomes importados de PDF.
- `refeicoes_cardapio.dia_rotulo` pelo mesmo motivo.
- `exercicios_treino.link_externo`, `grupo_nome`, `ordem_grupo`.
- `desafios.criterio_avaliacao`, `aprovador_responsavel`.
- Historico de eventos de entregas.
- Arquivos anexados estruturados.
- Configuracoes/regras/permissoes por comunidade.
- Historico de tags.
- Log de IA.
- Auditoria.
- Fechamento semanal/snapshot.
- Indices/unicos para evitar duplicidade.
