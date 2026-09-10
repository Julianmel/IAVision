# 👁️‍🗨️ IAVision — Assistente Visual & OCR por Voz com Gemini 3.6 Flash

Aplicação autônoma para visão computacional, leitura integral de documentos (OCR) e audiodescrição em tempo real, acionada 100% por comandos de voz ou cliques na interface.

---

## 🚀 Funcionalidades

* 📸 **Captura via Webcam em Alta Definição:** Exibe o vídeo espelhado em tempo real para posicionamento natural e captura o snapshot na orientação real (desespelhado) para leitura fiel de textos.
* 📄 **OCR Completo de Documentos:** Lê na íntegra receitas médicas, notas fiscais, contratos, livros, cartões e tabelas complexas sem fazer resumos nem omitir dados.
* 💬 **Área Interativa de IA para Dúvidas do Documento:** Assim que um documento é digitalizado, abre-se automaticamente uma área de perguntas com botões de sugestões rápidas (resumo, medicamentos, datas, valores), campo de texto e entrada de voz para tirar qualquer dúvida sobre o documento lido.
* 🧠 **Alimentado pelo Gemini 3.6 Flash:** Conectado à API mais recente do Google AI Studio com suporte ao novo formato oficial de chaves de autenticação (`AQ.`).
* 🗣️ **Controle Total por Voz:** O navegador escuta passivamente seus comandos via Web Speech API em português (`pt-BR`).
* 🔊 **Narrador Contínuo com Parada Imediata:** Leitura em voz alta de parágrafos longos sem interrupções e com parada instantânea ao comando de *"Silêncio"* ou clique no botão vermelho.
* 📋 **Cópia Rápida:** Botão para copiar todo o texto extraído ou as respostas da IA para a área de transferência com um clique.

---

## 🗣️ Comandos de Voz Suportados

| Comando | Ação |
| :--- | :--- |
| **"Ler documento"** / **"Ler documento todo"** / **"Leia tudo"** | Dispara o OCR exaustivo para transcrever cada linha de documentos e tabelas. |
| **"Pergunta: [sua dúvida]"** / **"Dúvida: [sua dúvida]"** | Faz uma pergunta por voz para a IA sobre o documento digitalizado. |
| **"Tirar uma foto"** / **"O que você vê?"** / **"Olha isso"** | Descreve a cena ou objetos na frente da câmera. |
| **"Silêncio"** / **"Parar"** / **"Para a voz"** | Interrompe imediatamente o narrador de áudio. |

---

---

## ⚡ Como Executar no Windows (Sem Instalar Nada)

Você pode baixar e executar diretamente o **executável autônomo** para Windows:

1. Acesse os lançamentos: 👉 **[Releases do IAVision no GitHub](https://github.com/Julianmel/IAVision/releases)**
2. Baixe o `IAVision.exe` (ou o pacote `IAVision-v1.2.0-Windows.zip`).
3. Dê um duplo clique em `IAVision.exe`:
   * O servidor local é iniciado automaticamente.
   * Seu navegador padrão abrirá em **http://localhost:3000**.
   * Não precisa de Node.js nem de dependências adicionais instaladas!

---

## 🛠️ Como Executar com Node.js (Desenvolvedores)

### Pré-requisitos
* [Node.js](https://nodejs.org/) instalado (v18 ou superior).

### Passo a passo
1. Clone ou acesse a pasta do projeto:
   ```bash
   cd C:\Users\Julian\Dev\IAVision
   ```

2. Inicie o servidor:
   ```bash
   npm start
   # ou
   node server.mjs
   ```

3. Abra o navegador no endereço:
   👉 **[http://localhost:3000](http://localhost:3000)**

4. Insira sua chave do Google AI Studio no topo (formato `AQ.` ou `AIza...`) e clique em **"🧪 Testar Chave"**. A chave fica salva localmente no navegador.

---

## 🐙 Como Subir para o GitHub

1. No terminal da pasta `C:\Users\Julian\Dev\IAVision`, inicialize o Git:
   ```bash
   git init
   git add .
   git commit -m "feat: versão inicial do IAVision com OCR e voz"
   ```

2. Crie um novo repositório no seu [GitHub](https://github.com/new) chamado `IAVision`.

3. Conecte o repositório local ao GitHub e faça o envio:
   ```bash
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/IAVision.git
   git push -u origin main
   ```

---

## 📄 Licença
Distribuído sob a licença MIT. Sinta-se livre para usar e modificar.
