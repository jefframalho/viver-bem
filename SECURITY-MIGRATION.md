# Acesso seguro — implantação coordenada

Esta alteração está preparada para revisão; não publica regras nem modifica documentos do banco por conta própria. O fechamento do alerta da chave não substitui estas correções.

## Comportamento

- Candidaturas, consultas de protocolo e contratos exigem Firebase Authentication com e-mail e senha **e confirmação do e-mail**. Contas públicas não recebem papel administrativo ou profissional automaticamente.
- Uma candidatura nova guarda `ownerUid`, sempre o UID autenticado. CPF e protocolo localizam o registro, mas não o autorizam. A candidatura e os cinco anexos são enviados em um único lote atômico.
- Somente o titular pode reenviar os tipos de documento que a administração solicitou. O envio de um profissional usa seu próprio `profId`; o cliente não pode trocar o vínculo do documento.
- Contratos exigem `signerUid` ou, para autônomos, o titular da candidatura indicada em `refId`. A assinatura registra o UID e não pode alterar o texto do contrato. Isso é controle de acesso e não constitui, por si só, certificação jurídica ou prova independente de identidade.
- Pacientes usam `profIds: ["id-do-profissional", ...]`, controlado pela administração. Sem autorização explícita, o profissional não lê o cadastro, as medições ou intercorrências. Plantões e consultas já atribuídos continuam acessíveis ao profissional indicado neles.
- Plantões sem profissional não são mais baixados com dados clínicos para toda a equipe. A tela de oportunidades ficará sem esses registros; uma futura lista pública deverá conter apenas resumos sem dados dos pacientes.
- A família solicita teleconsulta; só a central confirma e altera a agenda. A solicitação não é uma reserva automática nem garante disponibilidade.
- Auditoria do cliente exige papel cadastrado, UID, perfil/nome correspondentes e horário do servidor. Não aceita alteração/exclusão pelo cliente, inclusive administrador. Não é uma auditoria independente de ações realizadas no servidor.
- O service worker usa uma lista de arquivos estáticos do mesmo domínio. Não intercepta/cacheia respostas de Authentication, Firestore ou URLs externas. A versão do cache muda para remover os caches anteriores.

## Antes de ativar em produção

1. Faça backup/exportação do banco pelo procedimento de operação já adotado. Esta mudança não apaga nem migra dados existentes.
2. Confirme no Firebase Authentication que **E-mail/senha** está habilitado, revise o modelo do e-mail de confirmação e os domínios autorizados do site. Não habilite cadastro com privilégios: `/usuarios` permanece sob controle administrativo.
3. No Firestore, preencha `profIds` de cada paciente com a equipe autorizada. A administração também terá a ação **Equipe autorizada** na nova interface. Revise plantões e consultas atribuídos: eles próprios dão acesso aos respectivos atendimentos.
4. Cadastros antigos **não serão apropriados por CPF nem por e-mail digitado**. Peça ao titular que crie/verifique sua conta e informe o UID exibido no acesso seguro. Confira a identidade por canal confiável antes de preencher `ownerUid` no candidato. A nova interface inclui **Vincular conta**.
5. Para contratos antigos de pacientes ou autônomos sem candidatura vinculada, confira a identidade do assinante e preencha `signerUid`. A interface inclui **Vincular assinante**. Um contrato de autônomo com candidatura usa também o `ownerUid` dela; revise esse vínculo ao trocar o titular. Nunca atribua todos os contratos a uma conta de teste.
6. Em uma janela coordenada, publique o código novo do site e as novas regras (`firebase deploy --only firestore:rules --project viver-bem-d23bd`, por um operador autenticado com permissão). O repositório não possui publicação automática de regras. GitHub Pages não publica regras do Firestore.
7. Atualize/recarregue os aplicativos instalados para receber o novo service worker. Clientes antigos podem receber `permission-denied` após a atualização das regras.
8. Teste em contas distintas: administração, profissional autorizado, outro profissional, família, candidato e assinante. Teste login, confirmação de e-mail, cadastro com anexos, consulta do andamento, reenvio solicitado, assinatura, medições e pedido de teleconsulta. Teste também que outra conta não abre o mesmo link.

Não publique somente as regras esperando que os fluxos antigos de links públicos continuem iguais. Registros sem vínculo ficam indisponíveis para o público até a conferência administrativa. Isso é intencional.

## Validação local

```sh
npm ci
npm test
```

Necessário Node.js 22 e Java 17. O comando utiliza apenas o emulador local e o projeto demonstrativo `demo-viver-bem-security`; não se conecta ao banco de produção. Não use dados reais nos testes.

As regras mantêm o formulário de solicitação inicial público, com campos/tamanho limitados. Proteção contra spam/abuso em escala e App Check precisam de configuração operacional adicional. A revisão também não valida regras de Storage, permissões IAM ou documentos efetivamente existentes no banco.
