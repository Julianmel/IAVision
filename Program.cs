using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Diagnostics;

namespace IAVision
{
    class Program
    {
        private static HttpListener listener;
        private static bool isRunning = true;
        private static int port = 3000;

        static void Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;
            Console.Title = "IAVision — Assistente Visual & OCR";

            PrintBanner();

            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            string htmlPath = Path.Combine(appDir, "index.html");

            // Tenta iniciar o listener na porta 3000 (ou sucessoras se ocupada)
            for (int p = 3000; p <= 3010; p++)
            {
                try
                {
                    listener = new HttpListener();
                    listener.Prefixes.Add("http://localhost:" + p + "/");
                    listener.Prefixes.Add("http://127.0.0.1:" + p + "/");
                    listener.Start();
                    port = p;
                    break;
                }
                catch (Exception)
                {
                    if (listener != null)
                    {
                        try { listener.Close(); } catch { }
                    }
                }
            }

            if (listener == null || !listener.IsListening)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("\n[ERRO] Não foi possível vincular o servidor às portas 3000-3010.");
                Console.ResetColor();
                Console.WriteLine("Pressione qualquer tecla para sair...");
                Console.ReadKey();
                return;
            }

            string appUrl = "http://localhost:" + port;
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("[✔] Servidor Web local ativo em: " + appUrl);
            Console.ResetColor();

            // Abrir o navegador automaticamente
            try
            {
                Process.Start(new ProcessStartInfo(appUrl) { UseShellExecute = true });
                Console.ForegroundColor = ConsoleColor.Cyan;
                Console.WriteLine("[✔] Navegador padrão aberto automaticamente!");
                Console.ResetColor();
            }
            catch (Exception)
            {
                Console.WriteLine("[!] Abra manualmente o link no seu navegador: " + appUrl);
            }

            Console.WriteLine("\n------------------------------------------------------------");
            Console.WriteLine(" Dicas de Uso:");
            Console.WriteLine(" • Insira sua Chave do Google AI Studio no topo da página.");
            Console.WriteLine(" • Comandos de voz suportados:");
            Console.WriteLine("   - 'Ler documento' ou 'Leia tudo' (OCR exaustivo)");
            Console.WriteLine("   - 'Tirar uma foto' ou 'O que você vê?' (visão geral)");
            Console.WriteLine("   - 'Silêncio' ou 'Parar' (interrompe leitura)");
            Console.WriteLine("------------------------------------------------------------");
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("\nMantenha esta janela aberta enquanto estiver utilizando o app.");
            Console.WriteLine("Pressione Ctrl+C para encerrar.\n");
            Console.ResetColor();

            // Loop de atendimento de requisições HTTP
            Thread serverThread = new Thread(() =>
            {
                while (isRunning)
                {
                    try
                    {
                        HttpListenerContext context = listener.GetContext();
                        ThreadPool.QueueUserWorkItem((c) => HandleRequest((HttpListenerContext)c, htmlPath), context);
                    }
                    catch (HttpListenerException)
                    {
                        break;
                    }
                    catch (Exception ex)
                    {
                        if (isRunning) Console.WriteLine("[AVISO] " + ex.Message);
                    }
                }
            });
            serverThread.IsBackground = true;
            serverThread.Start();

            // Aguarda sinal de saída
            Console.CancelKeyPress += (s, e) =>
            {
                e.Cancel = true;
                isRunning = false;
                StopServer();
            };

            while (isRunning)
            {
                Thread.Sleep(500);
            }
        }

        private static void HandleRequest(HttpListenerContext context, string htmlPath)
        {
            HttpListenerRequest request = context.Request;
            HttpListenerResponse response = context.Response;

            response.Headers.Add("Access-Control-Allow-Origin", "*");
            response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, x-goog-api-key");
            response.Headers.Add("Cache-Control", "no-store, no-cache, must-revalidate");

            if (request.HttpMethod == "OPTIONS")
            {
                response.StatusCode = 204;
                response.Close();
                return;
            }

            string rawUrl = request.Url.AbsolutePath;

            if (request.HttpMethod == "GET" && (rawUrl == "/" || rawUrl == "/index.html"))
            {
                byte[] htmlBytes = null;
                if (File.Exists(htmlPath))
                {
                    try { htmlBytes = File.ReadAllBytes(htmlPath); } catch { }
                }

                if (htmlBytes == null)
                {
                    using (Stream stream = typeof(Program).Assembly.GetManifestResourceStream("index.html"))
                    {
                        if (stream != null)
                        {
                            using (MemoryStream ms = new MemoryStream())
                            {
                                stream.CopyTo(ms);
                                htmlBytes = ms.ToArray();
                            }
                        }
                    }
                }

                if (htmlBytes == null)
                {
                    string fallbackHtml = "<html><body style='font-family:sans-serif;padding:40px;background:#090d16;color:#fff;text-align:center;'>"
                        + "<h1>👁️‍🗨️ IAVision</h1><p>Não foi possível carregar a interface.</p></body></html>";
                    htmlBytes = Encoding.UTF8.GetBytes(fallbackHtml);
                }

                response.ContentType = "text/html; charset=utf-8";
                response.ContentLength64 = htmlBytes.Length;
                response.OutputStream.Write(htmlBytes, 0, htmlBytes.Length);
                response.OutputStream.Close();
                return;
            }

            // Para outras rotas não atendidas
            response.StatusCode = 404;
            byte[] notFound = Encoding.UTF8.GetBytes("Not Found");
            response.OutputStream.Write(notFound, 0, notFound.Length);
            response.OutputStream.Close();
        }

        private static void StopServer()
        {
            try
            {
                Console.WriteLine("\nEncerrando IAVision...");
                if (listener != null && listener.IsListening)
                {
                    listener.Stop();
                    listener.Close();
                }
            }
            catch { }
            Environment.Exit(0);
        }

        private static void PrintBanner()
        {
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine(@"============================================================");
            Console.WriteLine(@"   👁️‍🗨️  IAVision — Assistente Visual & OCR Completo       ");
            Console.WriteLine(@"        Versão Desktop Standalone para Windows             ");
            Console.WriteLine(@"============================================================");
            Console.ResetColor();
        }
    }
}
