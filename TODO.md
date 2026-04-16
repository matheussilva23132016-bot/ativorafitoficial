# ✅ TODO: Corrigir AtivoraFeed Desconfigurado (Aprovado pelo usuário: SIM)

## ✅ 1. Aprovação do Plano (Concluído)
- [x] Usuário aprovou plano (SIM)
- [x] Plano detalhado com análise de arquivos, DB e causas

## ✅ 2. Verificar/Instalar Dependências
- [x] SWR adicionado no package.json

## ✅ 3. Melhorar API /api/posts/listar/route.ts
- [x] Subquery hasLiked (curtidas)
- [x] minutes_ago, xp, comentarios_count
- [x] Params corrigidos [currentUser, currentUser]

## ✅ 4. Integrar Fetch Real no AtivoraFeed.tsx (PRIORIDADE ALTA)
- [x] Remover mocks → SWR real data
- [x] useSWR `/api/posts/listar?currentUser=${username}`
- [x] SWR `/api/social/stories/listar`
- [ ] Infinite scroll (próximo)
- [x] postsMapped DB → PostData (hasLiked, timestamp)
- [x] loading/error states

## ⬜ 5. Fix Props Parent AtivoraSocial.tsx
- [ ] Passar currentUser real para Feed
- [ ] Verificar session/auth context

## ⬜ 6. Integrar Mutations (Likes/Comments/Post)
- [ ] PostCard: toggle like → /api/posts/curtir
- [ ] Comments: fetch/save real
- [ ] Composer: post real → /api/posts/salvar

## ⬜ 7. Testes
- [ ] `npm run dev`
- [ ] Acessar /dashboard/social → feed com dados reais
- [ ] Test like/comment/post
- [ ] Console sem erros, responsive OK

## ⬜ 8. Otimizações Opcionais
- [ ] Virtualização (se 100+ posts)
- [ ] Refresh onFocus (SWR)
- [ ] Pull-to-refresh mobile

## ✅ 9. Conclusão
- [ ] Atualizar este TODO
- [ ] attempt_completion com demo command
