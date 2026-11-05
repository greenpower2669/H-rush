package fr.fab.ashrush;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** H-RUSH OMEGA, local-only WebView, Android SAF backup; NO INTERNET permission. */
public final class MainActivity extends Activity {
    private static final int IMPORT_REQUEST = 511;
    private static final int EXPORT_REQUEST = 512;
    private WebView webView;
    private ValueCallback<Uri[]> pendingOpen;
    private String pendingExport;

    /** Only the bundled file:///android_asset/ app can invoke this interface. */
    public final class UniverseBridge {
        @JavascriptInterface public void saveUniverse(String json) {
            if (json == null || json.length() > 3000000 || !json.contains("\"seed\"")) return;
            runOnUiThread(() -> {
                pendingExport = json;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, "AshRush-Omega-univers.json");
                try { startActivityForResult(intent, EXPORT_REQUEST); }
                catch (Exception e) { pendingExport = null; toast("Export indisponible sur cet appareil"); }
            });
        }
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(5, 10, 30));
        WebSettings config = webView.getSettings();
        config.setJavaScriptEnabled(true);
        config.setDomStorageEnabled(true);
        config.setAllowFileAccess(true);
        config.setAllowContentAccess(true); // Android document picker URI, never network
        config.setMediaPlaybackRequiresUserGesture(false);
        webView.addJavascriptInterface(new UniverseBridge(), "AshRushAndroid");
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                                        FileChooserParams params) {
                if (pendingOpen != null) pendingOpen.onReceiveValue(null);
                pendingOpen = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                try { startActivityForResult(intent, IMPORT_REQUEST); return true; }
                catch (Exception e) { pendingOpen = null; callback.onReceiveValue(null); toast("Import indisponible"); return true; }
            }
        });
        setContentView(webView);
        hideSystemBars();
        webView.loadUrl("file:///android_asset/ash-rush-standalone.html");
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == IMPORT_REQUEST) {
            if (pendingOpen != null) {
                Uri uri = result == RESULT_OK && data != null ? data.getData() : null;
                pendingOpen.onReceiveValue(uri == null ? null : new Uri[]{uri});
                pendingOpen = null;
            }
        } else if (request == EXPORT_REQUEST) {
            if (result == RESULT_OK && data != null && data.getData() != null && pendingExport != null) {
                try (OutputStream stream = getContentResolver().openOutputStream(data.getData())) {
                    if (stream != null) { stream.write(pendingExport.getBytes(StandardCharsets.UTF_8)); toast("Univers OMEGA exporté"); }
                    else toast("Le fichier de sauvegarde n'a pas pu être ouvert");
                } catch (Exception e) { toast("Erreur d'enregistrement de l'univers"); }
            }
            pendingExport = null;
        }
    }
    private void toast(String text) { Toast.makeText(this, text, Toast.LENGTH_SHORT).show(); }

    private void hideSystemBars() {
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.systemBars());
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        }
    }
    @Override public void onWindowFocusChanged(boolean hasFocus) { super.onWindowFocusChanged(hasFocus); if (hasFocus) hideSystemBars(); }
    @Override public void onPause() { if (webView != null) webView.onPause(); super.onPause(); }
    @Override public void onResume() { super.onResume(); if (webView != null) webView.onResume(); }
    @Override protected void onDestroy() {
        if (pendingOpen != null) pendingOpen.onReceiveValue(null);
        if (webView != null) { webView.destroy(); webView = null; }
        super.onDestroy();
    }
}
