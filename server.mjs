import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const OUTPUT_FILE = path.join(__dirname, 'captura_webcam.jpg');
const HTML_FILE = path.join(__dirname, 'index.html');

// Lista de modelos disponíveis na conta do Google AI Studio
async function obterModelosDisponiveis(apiKey) {
  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models';
    const resp = await fetch(url, {
      method: 'GET',
      headers: { 'x-goog-api-key': apiKey }
    });
    const data = await resp.json();
    if (data.models && Array.isArray(data.models)) {
      return data.models
        .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace('models/', ''));
    }
  } catch (err) {
    console.warn('[GEMINI] Não foi possível listar modelos:', err.message);
  }
  return [];
}

// Função para chamar o Gemini via backend (Node.js) com OCR exaustivo
async function chamarGeminiBackend(base64Data, apiKey, modo, textoPrompt) {
  const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '').replace(/^Bearer\s+/i, '');
  if (!cleanKey) {
    throw new Error('Chave de API vazia.');
  }

  let prompt = textoPrompt;
  if (!prompt) {
    if (modo === 'ocr') {
      prompt = `Você é um leitor de documentos e especialista em OCR de alta precisão e acessibilidade.
Sua missão é transcrever e narrar na íntegra CADA LINHA E CADA PALAVRA do documento mostrado na imagem. NÃO RESUMA NADA.

Siga rigorosamente esta ordem de leitura:
1. Cabeçalho e Identificação:
   - Leia todos os títulos, órgãos públicos/privados, logotipos (ex: SUS, Secretarias, Estado, Clínicas).
   - Leia nomes de pacientes, médicos, estabelecimentos, municípios, códigos CNES, datas de validade e números de protocolo.
2. Tabelas e Medicamentos/Itens (MUITO IMPORTANTE):
   - Se houver uma tabela (ex: medicamentos, exames, pedidos, notas fiscais), leia CADA UMA das linhas da tabela individualmente.
   - Para cada item, leia o nome do medicamento/produto, laboratório fabricante, código, lote, validade, quantidade e data de entrega.
   - NUNCA diga apenas "há uma tabela com medicamentos". Leia todos os itens um a um!
3. Observações, Informações e Rodapé:
   - Leia todas as observações na íntegra (ex: regras de renovação, documentação necessária).
   - Leia todas as instruções de transporte ou avisos (ex: necessidade de caixa térmica com gelox/gelo, prazos, telefones).

Formato da resposta:
Escreva tudo em texto corrido e bem pontuado (com pontos finais e vírgulas) para que a síntese de voz (áudio) leia de forma clara, natural e sem falhas do início ao fim.`;
    } else {
      prompt = `Você é um assistente visual inteligente.
Se houver um documento, folha, livro, tela ou texto escrito em destaque nesta foto: atue como OCR e leia na íntegra todo o conteúdo escrito.
Se for um objeto, pessoa ou cena comum: descreva o que vê com clareza, naturalidade e objetividade.
Sua resposta será lida em voz alta em português do Brasil.`;
    }
  }

  const parts = [{ text: prompt }];
  if (base64Data) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data
      }
    });
  }

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      maxOutputTokens: 3500, // Limite amplo para documentos inteiros com tabelas
      temperature: 0.1 // Máxima precisão e fidelidade ao texto real
    }
  };

  const modelosPreferidos = [
    'gemini-flash-latest',
    'gemini-3.5-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash'
  ];
  let ultimoErro = null;

  for (const modelo of modelosPreferidos) {
    try {
      console.log(`[GEMINI] Processando (${modo || 'teste'}) com ${modelo}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': cleanKey
        },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();

      if (!resp.ok) {
        const msg = data.error?.message || `Erro HTTP ${resp.status}`;
        console.warn(`[GEMINI] Erro no modelo ${modelo}:`, msg);
        throw new Error(msg);
      }

      const respostaTexto = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (respostaTexto) {
        console.log(`[GEMINI] Sucesso no modelo ${modelo}! Tamanho resposta: ${respostaTexto.length} caracteres.`);
        return respostaTexto.trim();
      }
    } catch (err) {
      ultimoErro = err;
    }
  }

  // Fallback dinâmico
  const modelosAtivos = await obterModelosDisponiveis(cleanKey);
  for (const modelo of modelosAtivos) {
    if (modelosPreferidos.includes(modelo)) continue;
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': cleanKey
        },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (resp.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text.trim();
      }
    } catch (e) {}
  }

  throw ultimoErro || new Error('Não foi possível obter resposta dos modelos do Gemini.');
}

const server = http.createServer(async (req, res) => {
  console.log(`[HTTP ${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);

  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  // Servir página HTML
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    try {
      const html = fs.readFileSync(HTML_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...noCacheHeaders });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Erro ao carregar HTML: ' + err.message);
    }
    return;
  }

  // Rota de Teste de Chave de API
  if (req.method === 'POST' && req.url === '/api/test-key') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        console.log('[TEST-KEY] Testando chave...');
        const { apiKey } = JSON.parse(body);
        const resposta = await chamarGeminiBackend(null, apiKey, 'teste', "Responda em uma única palavra: 'Funcionando'");
        res.writeHead(200, { 'Content-Type': 'application/json', ...noCacheHeaders });
        res.end(JSON.stringify({ success: true, message: resposta }));
      } catch (e) {
        res.writeHead(200, { 'Content-Type': 'application/json', ...noCacheHeaders });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // Rota de Análise / OCR de Imagem
  if (req.method === 'POST' && req.url === '/api/analyze') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { image, apiKey, mode } = JSON.parse(body);
        console.log(`[ANALYZE] Recebendo imagem para OCR exaustivo - Modo: ${mode || 'geral'}`);

        try {
          fs.writeFileSync(OUTPUT_FILE, Buffer.from(image, 'base64'));
        } catch (saveErr) {
          console.warn('Aviso ao salvar arquivo local:', saveErr.message);
        }

        const descricao = await chamarGeminiBackend(image, apiKey, mode);
        console.log('[ANALYZE] Processamento concluído com sucesso!');
        res.writeHead(200, { 'Content-Type': 'application/json', ...noCacheHeaders });
        res.end(JSON.stringify({ success: true, text: descricao }));
      } catch (e) {
        console.error('[ANALYZE] Erro no processamento:', e.message);
        res.writeHead(200, { 'Content-Type': 'application/json', ...noCacheHeaders });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // Rota de Perguntas sobre o Documento Digitalizado
  if (req.method === 'POST' && req.url === '/api/ask-document') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { question, documentText, image, apiKey } = JSON.parse(body);
        console.log(`[ASK-DOCUMENT] Pergunta recebida: "${question}"`);

        const promptQnA = `Você é o assistente inteligente IAVision especializado em análise de documentos.
O usuário digitalizou o seguinte documento:
---
${documentText || '(Texto não disponível, consulte a imagem se fornecida)'}
---

Pergunta do usuário: "${question}"

Instruções:
1. Responda à pergunta do usuário baseando-se com máxima precisão nas informações do documento acima.
2. Seja direto, claro e explicativo na medida certa.
3. Se a informação solicitada não constar no documento, informe isso de maneira transparente e educada.
4. Escreva a resposta em português do Brasil com boa pontuação para facilitar a leitura em voz alta por síntese de áudio.`;

        const resposta = await chamarGeminiBackend(image, apiKey, 'qna', promptQnA);
        console.log(`[ASK-DOCUMENT] Resposta gerada com sucesso! (${resposta.length} caracteres)`);
        res.writeHead(200, { 'Content-Type': 'application/json', ...noCacheHeaders });
        res.end(JSON.stringify({ success: true, answer: resposta }));
      } catch (e) {
        console.error('[ASK-DOCUMENT] Erro:', e.message);
        res.writeHead(200, { 'Content-Type': 'application/json', ...noCacheHeaders });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404, noCacheHeaders);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`👁️‍🗨️ IAVision - Assistente Visual & OCR`);
  console.log(`🚀 Servidor ativo em: http://localhost:${PORT}`);
  console.log(`=========================================`);
});
