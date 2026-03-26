# 🏋️ My VYM — Plataforma de Gestão Fitness

**My VYM** é uma plataforma web fullstack para personal trainers e alunos, oferecendo gerenciamento completo de treinos, dietas, avaliações físicas e diário alimentar — tudo em um só lugar.

---

## ✨ Funcionalidades

| Módulo | Descrição |
|---|---|
| 👤 **Alunos** | Cadastro, edição e exclusão de alunos com perfil completo |
| 🏋️ **Treinos** | Criação de fichas de treino com exercícios e acompanhamento de progresso |
| 🥗 **Dietas** | Planos alimentares personalizados por aluno |
| 📊 **Avaliações Físicas** | Registro histórico de medidas e evolução corporal com gráficos |
| 🍽️ **Diário Alimentar** | Log diário de refeições com busca de alimentos via API Edamam |
| 🔐 **Autenticação** | Login com JWT para dois perfis: **Admin (Personal)** e **Aluno** |
| 📄 **Export PDF** | Geração e download de relatórios em PDF |

---

## 🛠️ Stack Tecnológica

**Frontend**
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) — bundler e dev server
- [TailwindCSS v4](https://tailwindcss.com/) — estilização
- [Recharts](https://recharts.org/) — gráficos de avaliação física
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) — formulários e validação
- [React Router DOM v7](https://reactrouter.com/) — roteamento
- [Lucide React](https://lucide.dev/) — ícones
- [Motion](https://motion.dev/) — animações
- [jsPDF](https://github.com/parallax/jsPDF) + [html2canvas](https://html2canvas.hertzen.com/) — geração de PDF

**Backend**
- [Express.js](https://expressjs.com/) — servidor REST API
- [PostgreSQL](https://www.postgresql.org/) + [node-postgres (pg)](https://node-postgres.com/) — banco de dados
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — hash de senhas
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) — autenticação JWT
- [Edamam Food API](https://developer.edamam.com/) — busca de alimentos

**Infraestrutura**
- [Docker](https://www.docker.com/) + Docker Compose — ambiente containerizado
- [tsx](https://github.com/privatenumber/tsx) — execução de TypeScript no Node

---

## 🚀 Como Executar

### ▶️ Opção 1 — Docker (Recomendado)

1. **Clone o repositório:**
   ```bash
   git clone <url-do-repositório>
   cd My-VYM
   ```

2. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas chaves
   ```

3. **Suba os containers:**
   ```bash
   docker compose up --build
   ```

4. **Acesse:** [http://localhost:3000](http://localhost:3000)

> 💡 No Windows, você pode usar o atalho `iniciar.bat` para subir o projeto.

---

### ▶️ Opção 2 — Local (Sem Docker)

**Pré-requisitos:** Node.js 20+, PostgreSQL 16+

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure o `.env` com a `DATABASE_URL` apontando para seu PostgreSQL local.

3. Inicie em modo desenvolvimento:
   ```bash
   npm run dev
   ```

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:

```env
# Banco de dados
DATABASE_URL=postgresql://vym_user:vym_password@localhost:5432/vym_db

# Segurança
JWT_SECRET=sua-chave-secreta-aqui

# API de alimentos (Edamam)
EDAMAM_APP_ID=seu_app_id
EDAMAM_APP_KEY=sua_app_key

# SSL (para ambientes corporativos com proxy)
IGNORE_SSL_ERRORS=false
```

> ⚠️ **Nunca compartilhe o arquivo `.env`.** Ele já está no `.gitignore`.

---

## 📡 Rotas da API

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/api/login` | Público | Autenticação |
| `GET` | `/api/students` | Auth | Lista alunos |
| `POST` | `/api/students` | Admin | Cadastra aluno |
| `PUT` | `/api/students/:id` | Admin | Edita aluno |
| `DELETE` | `/api/students/:id` | Admin | Remove aluno |
| `GET` | `/api/workouts` | Auth | Lista treinos |
| `POST` | `/api/workouts` | Admin | Cria treino |
| `PATCH` | `/api/workouts/:id/progress` | Auth | Atualiza progresso |
| `GET` | `/api/diets` | Auth | Lista dietas |
| `POST` | `/api/diets` | Admin | Cria dieta |
| `GET` | `/api/evaluations` | Auth | Lista avaliações |
| `POST` | `/api/evaluations` | Admin | Cria avaliação |
| `GET` | `/api/food/search` | Auth | Busca alimentos (Edamam) |
| `GET` | `/api/food/logs` | Auth | Busca diário alimentar |
| `POST` | `/api/food/logs` | Aluno | Salva diário alimentar |
| `GET` | `/api/health` | Público | Status da API |

---

## 🔐 Perfis de Acesso

| Perfil | Permissões |
|---|---|
| **Admin (Personal)** | Acesso total: gerencia alunos, treinos, dietas e avaliações |
| **Aluno** | Visualiza seus próprios dados, marca exercícios como concluídos e registra diário alimentar |

> A senha padrão de novos alunos cadastrados pelo admin é: `123456`

---

## 🐳 Estrutura Docker

```
my-vym/
├── app        → Container da aplicação (Node + Vite) na porta 3000
└── db         → Container PostgreSQL 16 na porta 5432
```

---

## 📁 Estrutura do Projeto

```
My-VYM/
├── src/
│   ├── components/     → Componentes React reutilizáveis
│   ├── pages/          → Páginas da aplicação
│   └── lib/            → Utilitários (ex: evaluationUtils)
├── server.ts           → Backend Express (API REST)
├── db.ts               → Configuração do pool PostgreSQL
├── vite.config.ts      → Configuração do Vite
├── docker-compose.yml  → Orquestração dos containers
├── Dockerfile          → Imagem da aplicação
└── iniciar.bat         → Script de inicialização (Windows)
```

---

## 📜 Scripts Disponíveis

```bash
npm run dev       # Inicia servidor em modo desenvolvimento (hot-reload)
npm run build     # Gera o build de produção (pasta /dist)
npm run start     # Inicia em modo produção
npm run lint      # Verificação de tipos TypeScript
```

---

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit suas mudanças: `git commit -m 'feat: adiciona minha feature'`
4. Push para a branch: `git push origin feature/minha-feature`
5. Abra um Pull Request

---

*Desenvolvido com ❤️ para simplificar a gestão de academias e personal trainers.*
