package com.iavision.app

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.os.Bundle
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private val PERMISSIONS_REQUEST_CODE = 101

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                mediaPlaybackRequiresUserGesture = false
                allowFileAccess = true
                allowContentAccess = true
                cacheMode = WebSettings.LOAD_DEFAULT
            }

            webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest) {
                    runOnUiThread {
                        request.grant(request.resources)
                    }
                }
            }

            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? {
                    val url = request.url
                    if (url.host == "iavision.local" || url.host == "localhost") {
                        val path = url.path ?: "/"
                        val assetPath = if (path == "/" || path == "/index.html") "index.html" else path.removePrefix("/")
                        try {
                            val stream = assets.open(assetPath)
                            val mime = when {
                                assetPath.endsWith(".html") -> "text/html"
                                assetPath.endsWith(".js") || assetPath.endsWith(".mjs") -> "application/javascript"
                                assetPath.endsWith(".css") -> "text/css"
                                assetPath.endsWith(".json") -> "application/json"
                                assetPath.endsWith(".png") -> "image/png"
                                assetPath.endsWith(".jpg") || assetPath.endsWith(".jpeg") -> "image/jpeg"
                                else -> "application/octet-stream"
                            }
                            val headers = mapOf(
                                "Access-Control-Allow-Origin" to "*",
                                "Access-Control-Allow-Methods" to "GET, POST, OPTIONS",
                                "Access-Control-Allow-Headers" to "*"
                            )
                            return WebResourceResponse(mime, "UTF-8", 200, "OK", headers, stream)
                        } catch (e: Exception) {
                            return null
                        }
                    }
                    return super.shouldInterceptRequest(view, request)
                }
            }
        }

        setContentView(webView)

        checkAndRequestPermissions()
        webView.loadUrl("https://iavision.local/index.html")
    }

    private fun checkAndRequestPermissions() {
        val permissions = arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        )
        val needed = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (needed.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, needed.toTypedArray(), PERMISSIONS_REQUEST_CODE)
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSIONS_REQUEST_CODE) {
            val allGranted = grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }
            if (allGranted) {
                webView.reload()
            } else {
                Toast.makeText(
                    this,
                    "Permissões de câmera e áudio são necessárias para o IAVision.",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (this::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
