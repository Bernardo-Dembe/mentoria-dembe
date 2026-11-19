# Mentoria Dembe — primeira versão

Website estático em HTML, CSS e JavaScript, com Supabase para autenticação, base de dados e imagens. Preparado para GitHub Pages.

## 1. Criar o projeto Supabase
1. Crie um projeto em https://supabase.com/.
2. Abra SQL Editor, crie uma query e execute todo o conteúdo de `supabase/schema.sql`.
3. Em Authentication > Users, crie o utilizador com o e-mail administrativo `bernardodembe@gmail.com` e defina uma palavra-passe forte.
4. Volte ao SQL Editor e execute novamente apenas o bloco final de `schema.sql` (o INSERT que seleciona o e-mail), para atribuir a função admin.
5. Em Project Settings > API, copie Project URL e a chave publicável (ou anon legacy, se for o que o painel disponibilizar).

## 2. Ligar o website ao Supabase
Edite `js/config.js` e substitua:
- `COLOQUE_AQUI_A_URL_DO_PROJETO` pela Project URL.
- `COLOQUE_AQUI_A_CHAVE_PUBLICAVEL` pela chave publicável/anon.

Nunca coloque `service_role` ou secret key no frontend. A chave publicável é segura para uso no browser apenas porque as políticas RLS deste projeto protegem as operações.

## 3. Publicar no GitHub Pages
1. Crie um repositório GitHub chamado `mentoria-dembe` (público, se usar GitHub Pages gratuito).
2. Carregue todos os ficheiros e pastas deste projeto para a raiz do repositório.
3. Abra Settings > Pages.
4. Em Build and deployment, selecione Deploy from a branch.
5. Escolha `main` e `/ (root)`, depois Save.
6. Aguarde a publicação. O endereço será semelhante a `https://SEU-USUARIO.github.io/mentoria-dembe/`.

## 4. Testar
1. Abra o endereço GitHub Pages.
2. A página inicial deve carregar; os catálogos ficam vazios até publicar conteúdo.
3. Abra `/admin.html`, entre com o e-mail e palavra-passe criados.
4. Crie um curso em rascunho, depois publique; verifique a página inicial.
5. Crie um produto e confirme que o preço aparece em Kz.

## 5. Atualizar o website
- Alterações no código: envie os ficheiros atualizados para o GitHub; Pages publica novamente.
- Novos cursos/produtos e imagens: faça login em `/admin.html`; não precisa editar código nem enviar novamente para o GitHub.

## Notas importantes
- A área pública lê apenas cursos/produtos publicados.
- O painel verifica a função `admin` na tabela `profiles`; a segurança real também é aplicada por RLS no Supabase.
- As imagens são públicas para visualização, mas apenas administradores podem carregá-las.
- O bucket `mentoria-media` é criado pelo SQL.
- A primeira versão não inclui pagamentos online, carrinho, inscrições com conta de aluno, nem gestão de múltiplas fotografias.
- O formulário de administração permite uma imagem por curso/produto. Pode ser ampliado numa próxima etapa.
- Para domínio próprio ou melhor suporte a rotas e cabeçalhos de segurança, podemos migrar a hospedagem posteriormente.

## Estrutura
- `index.html`: página inicial e catálogos.
- `curso.html` e `produto.html`: páginas de detalhe por ID.
- `admin.html`: login e painel administrativo.
- `css/style.css`: identidade visual e responsividade.
- `js/`: integração Supabase, páginas públicas e administração.
- `supabase/schema.sql`: tabelas, RLS, bucket e permissões.
