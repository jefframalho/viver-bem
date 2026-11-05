# Sistema Viver Bem — como colocar no ar

O sistema é um único arquivo (`public/index.html`). Sem configuração ele abre em **modo demonstração**, com dados de exemplo salvos só no aparelho. Para usar de verdade, ligue ao Firebase seguindo os passos abaixo.

## 1. Criar o projeto no Firebase
1. Acesse console.firebase.google.com e crie o projeto (ex.: `viverbem`). O plano gratuito (Spark) é suficiente.
2. **Authentication** → Começar → ative **E-mail/senha**.
3. **Firestore Database** → Criar banco → região `southamerica-east1` (São Paulo) → modo produção.
4. **Configurações do projeto** → Seus apps → ícone `</>` (Web) → registre o app e copie o objeto `firebaseConfig`.

## 2. Colar a configuração
Abra `public/index.html`, procure `const FIREBASE_CONFIG = null;` e troque o `null` pelo objeto copiado:

```js
const FIREBASE_CONFIG = { apiKey:"...", authDomain:"viverbem-xxxx.firebaseapp.com", projectId:"viverbem-xxxx", storageBucket:"...", messagingSenderId:"...", appId:"..." };
```

## 3. Criar o primeiro administrador
1. **Authentication** → Usuários → Adicionar usuário (e-mail e senha da dona/administração).
2. Copie o **UID** desse usuário.
3. **Firestore** → Iniciar coleção `usuarios` → ID do documento = o UID → campos:
   - `role` (string) = `admin`
   - `nome` (string) = nome da pessoa
   - `id` (string) = o mesmo UID

Os profissionais ganham acesso pelo próprio sistema (ficha do profissional → **Criar acesso ao app**).

## 4. Publicar (Firebase Hosting)
No computador, dentro desta pasta:

```
npm install -g firebase-tools
firebase login
firebase use --add            (escolha o projeto criado)
firebase deploy
```

O deploy publica o site **e** as regras de segurança (`firestore.rules`). O endereço fica `https://SEU-PROJETO.web.app`; depois dá para ligar um domínio próprio em Hosting → Adicionar domínio personalizado.

## 5. Primeiro uso
1. Entre como administrador → **Configurações**: preencha CNPJ, endereço, cidade (foro dos contratos), WhatsApp e a **tabela de valores**.
2. Cadastre operadoras, pacientes e profissionais.
3. Divulgue os links que aparecem no **Painel**:
   - `…/#trabalhe` — cadastro de candidatos com currículo
   - `…/#solicitar` — famílias e operadoras pedem atendimento
   - `…/#acompanhar` — candidato acompanha o processo seletivo

## Fluxo de recrutamento
Cadastro pelo link → Em análise → Entrevista → **Aprovar** (o sistema gera o contrato de autônomo) → enviar o link de assinatura pelo WhatsApp → candidato assina → **Adicionar à equipe** → **Criar acesso ao app**.

## Chegada e saída dos profissionais
- No celular, o profissional entra com o login dele, abre o plantão e toca em **Registrar chegada** (liberado 2 horas antes do início). Ao sair, escreve a evolução e toca em **Registrar saída**.
- O celular pede permissão de localização na primeira vez: oriente a equipe a tocar em **Permitir**.
- Na primeira chegada em uma casa nova, a administração pode usar aquele ponto como localização do paciente (botão no plantão). A partir daí, registros a mais de 300 m aparecem como **fora do endereço** na tela **Chegadas e saídas**.
- Dica: no celular, abra o sistema no Chrome e use **Adicionar à tela inicial** para virar um ícone de aplicativo.

## Observações
- Os modelos de contrato precisam ser revisados por um advogado antes do uso.
- Currículos: fotos são reduzidas automaticamente; PDF/Word até 700 KB (ficam guardados no próprio banco, sem precisar do plano pago).
- Backup: dá para usar o mesmo esquema do Clinix (GitHub Actions exportando o Firestore todo dia).
