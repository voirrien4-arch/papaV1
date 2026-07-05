// Gold_Crew — Admin APK Generator v7.1
// Secure Android project generator — 100% Gold_Crew / Mcamara
const AdminApkSubView = (() => {
  const WEB_FILES = [
    'index.html','main.js','styles.css',
    'locales/fr.json','locales/en.json','locales/ht.json',
    'js/state.js','js/storage.js','js/i18n.js','js/toast.js',
    'js/totp.js','js/fingerprint.js','js/bruteforce.js','js/auth.js',
    'js/router.js','js/admin.js','js/mistral-ai.js',
    'js/osint-engine.js','js/osint-sources-extra.js',
    'js/views/landing.js','js/views/auth.js','js/views/dashboard.js',
    'js/views/home-sub.js','js/views/search-sub.js','js/views/history-sub.js',
    'js/views/promo-sub.js','js/views/favorites-sub.js','js/views/stats-sub.js',
    'js/views/profile-sub.js','js/views/settings-sub.js',
    'js/views/admin-login.js','js/views/admin-panel.js',
    'js/views/admin-home-sub.js','js/views/admin-users-sub.js',
    'js/views/admin-osint-sources-sub.js','js/views/admin-promos-sub.js',
    'js/views/admin-api-keys-sub.js','js/views/admin-announcements-sub.js',
    'js/views/admin-site-settings-sub.js','js/views/admin-ai-sub.js',
    'js/views/admin-ai-sources-sub.js','js/views/admin-account-sub.js',
    'js/views/admin-sourcecode-sub.js','js/views/admin-apk-sub.js',
  ];

  function render(container) {
    container.innerHTML = `
      <div class="animate-fade-up" style="max-width:800px">
        <div class="glass-card p-5 mb-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded flex items-center justify-center" style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3)">
              <span style="color:var(--gold);font-size:1.2rem">📱</span>
            </div>
            <div>
              <h3 class="text-sm font-bold" style="color:var(--gold)">Générateur APK Android Sécurisé</h3>
              <p class="text-xs" style="color:var(--text-muted)">APK natif complet — camera, images, biométrie, notifications</p>
            </div>
          </div>
        </div>

        <div class="glass-card p-4 mb-4 animate-fade-up animate-delay-1" style="border-color:rgba(0,229,255,0.12)">
          <h4 class="text-xs font-bold mb-3" style="color:var(--cyan)">⚡ Fonctionnalités natives incluses</h4>
          <div class="grid gap-2 mb-3" style="grid-template-columns:1fr 1fr;font-size:0.65rem;color:var(--text-secondary)">
            <div>✓ Caméra (photo et scan)</div><div>✓ Upload images et fichiers</div>
            <div>✓ Biométrie (empreinte/face)</div><div>✓ Notifications locales</div>
            <div>✓ Partage de contenu</div><div>✓ Presse-papiers natif</div>
            <div>✓ Vibration et haptic</div><div>✓ Pull-to-refresh</div>
            <div>✓ Géolocalisation</div><div>✓ État réseau et batterie</div>
            <div>✓ Splash screen animé</div><div>✓ Status bar immersive</div>
          </div>
          <div class="flex items-start gap-3">
            <span style="color:var(--green);font-size:1.2rem">🛡️</span>
            <div>
              <h4 class="text-xs font-bold mb-1" style="color:var(--green)">Sécurité intégrée</h4>
              <div class="grid gap-1" style="grid-template-columns:1fr 1fr;font-size:0.6rem;color:var(--text-secondary)">
                <div>✓ JS obfusqué (base64)</div><div>✓ WebView debugging désactivé</div>
                <div>✓ Pas d'accès file://</div><div>✓ ProGuard debug + release</div>
                <div>✓ Mixed content bloqué</div><div>✓ Backup désactivé</div>
              </div>
            </div>
          </div>
        </div>

        <div class="glass-card p-5 mb-4 animate-fade-up animate-delay-2">
          <div class="flex items-center gap-2 mb-4">
            <span style="color:var(--amber);font-size:0.8rem">◈</span>
            <span class="text-xs font-bold" style="color:var(--amber);text-transform:uppercase;letter-spacing:0.08em">Configuration</span>
          </div>
          <div class="grid gap-4" style="grid-template-columns:1fr 1fr">
            <div><label class="block text-xs mb-1" style="color:var(--text-muted)">NOM DE L'APPLICATION</label><input type="text" id="apk-app-name" class="input-field" value="Gold_Crew OSINT" style="font-size:0.75rem" /></div>
            <div><label class="block text-xs mb-1" style="color:var(--text-muted)">ID DU PACKAGE</label><input type="text" id="apk-package" class="input-field" value="com.goldcrew.osint" style="font-size:0.75rem" /></div>
            <div><label class="block text-xs mb-1" style="color:var(--text-muted)">VERSION</label><input type="text" id="apk-version" class="input-field" value="1.0.0" style="font-size:0.75rem" /></div>
            <div><label class="block text-xs mb-1" style="color:var(--text-muted)">SDK MINIMUM</label>
              <select id="apk-minsdk" class="input-field" style="font-size:0.75rem">
                <option value="24" selected>API 24 — Android 7.0</option>
                <option value="23">API 23 — Android 6.0</option>
                <option value="26">API 26 — Android 8.0</option>
                <option value="28">API 28 — Android 9.0</option>
              </select></div>
          </div>
          <div class="mt-4">
            <label class="block text-xs mb-1" style="color:var(--text-muted)">COULEUR DU THÈME</label>
            <div class="flex items-center gap-3">
              <input type="color" id="apk-theme-color" value="#060606" style="width:50px;height:32px;border:1px solid var(--border-subtle);border-radius:var(--radius);cursor:pointer;background:#0a0a0a" />
              <span id="apk-theme-label" class="text-xs" style="color:var(--text-muted);font-family:var(--font-mono)">#060606</span>
            </div>
          </div>
          <div class="mt-4 space-y-2">
            <label class="block text-xs mb-2" style="color:var(--text-muted)">OPTIONS NATIVES</label>
            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="apk-opt-camera" checked style="accent-color:var(--green)" /><span class="text-xs" style="color:var(--text-secondary)">Activer la caméra (photo/scan)</span></label>
            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="apk-opt-biometric" checked style="accent-color:var(--green)" /><span class="text-xs" style="color:var(--text-secondary)">Activer la biométrie (empreinte)</span></label>
            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="apk-opt-notif" checked style="accent-color:var(--green)" /><span class="text-xs" style="color:var(--text-secondary)">Notifications locales</span></label>
            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="apk-opt-geoloc" checked style="accent-color:var(--green)" /><span class="text-xs" style="color:var(--text-secondary)">Géolocalisation</span></label>
          </div>
          <div class="mt-4 p-3 rounded" style="background:rgba(0,229,255,0.03);border:1px solid rgba(0,229,255,0.1)">
            <p class="text-xs" style="color:var(--cyan)">📱 <strong>Mode embarqué :</strong> ${WEB_FILES.length} fichiers intégrés. Aucune URL externe.</p>
          </div>
        </div>

        <div class="glass-card p-5 animate-fade-up animate-delay-3">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button id="apk-download-btn" class="btn btn-gold btn-lg"><span>📱</span> Générer le projet Android (.zip)</button>
            <span id="apk-status" class="text-xs" style="color:var(--text-muted)"></span>
          </div>
          <div id="apk-progress-wrap" class="mt-3" style="display:none">
            <div class="flex items-center justify-between mb-1">
              <span id="apk-progress-label" class="text-xs" style="color:var(--text-muted)">Préparation...</span>
              <span id="apk-progress-text" class="text-xs" style="color:var(--gold)">0%</span>
            </div>
            <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden">
              <div id="apk-progress-bar" style="height:100%;width:0%;background:var(--gold);border-radius:2px;transition:width 0.3s ease"></div>
            </div>
          </div>
          <div id="apk-instructions" class="mt-4" style="display:none">
            <div style="background:rgba(0,255,65,0.03);border:1px solid rgba(0,255,65,0.15);border-radius:var(--radius);padding:14px">
              <div class="flex items-center gap-2 mb-2"><span style="color:var(--green);font-size:1rem">✓</span><span class="text-xs font-bold" style="color:var(--green)">PROJET GÉNÉRÉ</span></div>
              <div class="text-xs" style="color:var(--text-secondary);line-height:1.8">
                <p class="mb-2"><strong style="color:var(--text-primary)">Compiler :</strong> Extraire → Android Studio → Sync Gradle → Build → APK dans app/build/outputs/apk/debug/</p>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    document.getElementById('apk-download-btn').addEventListener('click', handleGenerate);
    document.getElementById('apk-theme-color').addEventListener('input', function(e) {
      document.getElementById('apk-theme-label').textContent = e.target.value;
    });
  }

  // ── Robust file reader (fetch → XHR → retry) ──────────
  async function readFileRobust(path) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const resp = await fetch(path, { cache: 'no-store' });
        if (resp.ok) return await resp.text();
      } catch (e) { /* ignore */ }
      try {
        const text = await new Promise(function(resolve, reject) {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', path, true);
          xhr.onload = function() { if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.responseText); else reject(); };
          xhr.onerror = function() { reject(); };
          xhr.send();
        });
        if (text && text.length > 0) return text;
      } catch (e) { /* ignore */ }
      if (attempt < 2) await new Promise(function(r) { setTimeout(r, 400 * (attempt + 1)); });
    }
    throw new Error('Cannot read: ' + path);
  }

  // ── JS Obfuscation (base64 encode) ────────────────────
  function obfusJS(code) {
    try {
      var encoded = btoa(unescape(encodeURIComponent(code)));
      var chunks = [];
      for (var i = 0; i < encoded.length; i += 80) chunks.push(encoded.slice(i, i + 80));
      var lines = ['/* Protected - Gold_Crew OSINT */', '(function(){', 'var d="' + chunks.join('"+"') + '";'];
      lines.push('var s=decodeURIComponent(escape(atob(d)));');
      lines.push('var h=document.head||document.getElementsByTagName("head")[0];');
      lines.push('var t=document.createElement("script");t.text=s;h.appendChild(t);');
      lines.push('})();');
      return lines.join('\n') + '\n';
    } catch (e) { return code; }
  }

  // ── Progress helpers ──────────────────────────────────
  function updateProgress(done, total, bar, text) {
    var pct = Math.round((done / total) * 100);
    bar.style.width = pct + '%';
    text.textContent = pct + '%';
  }

  function loadScript(src) {
    return new Promise(function(resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function() { reject(new Error('Load fail: ' + src)); };
      document.head.appendChild(s);
    });
  }

  // ── Java code builder helpers ─────────────────────────
  function javaLines(arr) { return arr.join('\n'); }

  // ── Main generator ────────────────────────────────────
  async function handleGenerate() {
    var btn = document.getElementById('apk-download-btn');
    var status = document.getElementById('apk-status');
    var progressWrap = document.getElementById('apk-progress-wrap');
    var progressBar = document.getElementById('apk-progress-bar');
    var progressText = document.getElementById('apk-progress-text');
    var progressLabel = document.getElementById('apk-progress-label');
    var instructions = document.getElementById('apk-instructions');

    var appName = (document.getElementById('apk-app-name').value.trim() || 'Gold_Crew OSINT');
    var packageName = (document.getElementById('apk-package').value.trim() || 'com.goldcrew.osint');
    var version = (document.getElementById('apk-version').value.trim() || '1.0.0');
    var minSdk = document.getElementById('apk-minsdk').value || '24';
    var themeColor = document.getElementById('apk-theme-color').value || '#060606';
    var optCamera = document.getElementById('apk-opt-camera').checked;
    var optBiometric = document.getElementById('apk-opt-biometric').checked;
    var optNotif = document.getElementById('apk-opt-notif').checked;
    var optGeoloc = document.getElementById('apk-opt-geoloc').checked;

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px"></div> Génération...';
    status.textContent = '';
    progressWrap.style.display = 'block';
    instructions.style.display = 'none';

    try {
      if (!window.JSZip) {
        progressLabel.textContent = 'Chargement JSZip...';
        await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
      }

      var zip = new JSZip();
      var extraFiles = 25;
      var totalFiles = WEB_FILES.length + extraFiles;
      var done = 0;
      var pkg = packageName.replace(/[^a-zA-Z0-9.]/g, '.');
      var pkgPath = pkg.replace(/\./g, '/');
      var safeName = appName.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '');
      var vc = version.split('.').reduce(function(a, v) { return a * 100 + parseInt(v || 0); }, 0);
      var hex = themeColor.replace('#', '');
      var root = safeName || 'GoldCrewOSINT';

      progressLabel.textContent = 'Génération du projet Android...';

      // ── Permissions ──
      var perms = ['INTERNET', 'ACCESS_NETWORK_STATE', 'VIBRATE'];
      if (optCamera) perms.push('CAMERA');
      if (optGeoloc) perms.push('ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION');
      if (optNotif) perms.push('POST_NOTIFICATIONS', 'RECEIVE_BOOT_COMPLETED');
      var permXml = perms.map(function(p) { return '    <uses-permission android:name="android.permission.' + p + '" />'; }).join('\n');
      var camFeat = optCamera ? '\n    <uses-feature android:name="android.hardware.camera" android:required="false" />\n    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />' : '';
      var providerXml = optCamera ? '\n        <provider android:name="androidx.core.content.FileProvider"\n            android:authorities="${applicationId}.fileprovider"\n            android:exported="false"\n            android:grantUriPermissions="true">\n            <meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/file_paths" />\n        </provider>' : '';

      // ── Gradle deps ──
      var deps = [
        "    implementation 'androidx.appcompat:appcompat:1.6.1'",
        "    implementation 'androidx.webkit:webkit:1.8.0'",
        "    implementation 'com.google.android.material:material:1.10.0'",
        "    implementation 'androidx.swiperefreshlayout:swiperefreshlayout:1.1.0'"
      ];
      if (optBiometric) deps.push("    implementation 'androidx.biometric:biometric:1.1.0'");
      if (optNotif) deps.push("    implementation 'androidx.work:work-runtime:2.9.0'");

      // ── settings.gradle ──
      zip.file(root + '/settings.gradle', "rootProject.name = '" + safeName + "'\ninclude ':app'\n");
      updateProgress(++done, totalFiles, progressBar, progressText);

      // ── build.gradle (root) ──
      zip.file(root + '/build.gradle', javaLines([
        'buildscript {',
        '    repositories { google(); mavenCentral() }',
        "    dependencies { classpath 'com.android.tools.build:gradle:8.2.0' }",
        '}',
        'allprojects { repositories { google(); mavenCentral() } }',
        'task clean(type: Delete) { delete rootProject.buildDir }'
      ]));
      updateProgress(++done, totalFiles, progressBar, progressText);

      // ── gradle.properties ──
      zip.file(root + '/gradle.properties', 'android.useAndroidX=true\nandroid.enableJetifier=true\norg.gradle.jvmargs=-Xmx2048m\n');
      updateProgress(++done, totalFiles, progressBar, progressText);

      // ── gradle-wrapper.properties ──
      zip.file(root + '/gradle/wrapper/gradle-wrapper.properties', 'distributionBase=GRADLE_USER_HOME\ndistributionPath=wrapper/dists\ndistributionUrl=https\\://services.gradle.org/distributions/gradle-8.2-bin.zip\nzipStoreBase=GRADLE_USER_HOME\nzipStorePath=wrapper/dists\n');
      updateProgress(++done, totalFiles, progressBar, progressText);

      // ── app/build.gradle ──
      var releaseConfig = "        release {\n            minifyEnabled true\n            shrinkResources true\n            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'\n        }";
      var debugConfig = "        debug {\n            minifyEnabled true\n            shrinkResources true\n            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'\n            debuggable false\n        }";
      zip.file(root + '/app/build.gradle', javaLines([
        "plugins { id 'com.android.application' }",
        '',
        'android {',
        "    namespace '" + pkg + "'",
        '    compileSdk 34',
        '    defaultConfig {',
        '        applicationId "' + pkg + '"',
        '        minSdk ' + minSdk,
        '        targetSdk 34',
        '        versionCode ' + vc,
        '        versionName "' + version + '"',
        '    }',
        '    buildTypes {',
        releaseConfig,
        debugConfig,
        '    }',
        '    compileOptions {',
        '        sourceCompatibility JavaVersion.VERSION_1_8',
        '        targetCompatibility JavaVersion.VERSION_1_8',
        '    }',
        '    lintOptions { abortOnError false }',
        '}',
        '',
        'dependencies {',
        deps.join('\n'),
        '}'
      ]));
      updateProgress(++done, totalFiles, progressBar, progressText);

      // ── AndroidManifest.xml ──
      var manifestLines = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<manifest xmlns:android="http://schemas.android.com/apk/res/android"',
        '    xmlns:tools="http://schemas.android.com/tools">',
        '',
        permXml,
        camFeat,
        '',
        '    <application',
        '        android:allowBackup="false"',
        '        android:icon="@mipmap/ic_launcher"',
        '        android:roundIcon="@mipmap/ic_launcher_round"',
        '        android:label="@string/app_name"',
        '        android:supportsRtl="true"',
        '        android:theme="@style/AppTheme"',
        '        android:usesCleartextTraffic="false"',
        '        android:hardwareAccelerated="true"',
        '        android:networkSecurityConfig="@xml/network_security_config"',
        '        tools:targetApi="31">',
        '',
        '        <activity android:name=".SplashActivity"',
        '            android:exported="true"',
        '            android:theme="@style/SplashTheme">',
        '            <intent-filter>',
        '                <action android:name="android.intent.action.MAIN" />',
        '                <category android:name="android.intent.category.LAUNCHER" />',
        '            </intent-filter>',
        '        </activity>',
        '',
        '        <activity android:name=".MainActivity"',
        '            android:configChanges="orientation|screenSize|keyboard|keyboardHidden"',
        '            android:exported="false"',
        '            android:hardwareAccelerated="true"',
        '            android:windowSoftInputMode="adjustResize" />',
        '',
        providerXml,
        '',
        '    </application>',
        '</manifest>'
      ];
      zip.file(root + '/app/src/main/AndroidManifest.xml', manifestLines.join('\n'));
      updateProgress(++done, totalFiles, progressBar, progressText);

      // ── MainActivity.java ──
      var mainImports = [
        'package ' + pkg + ';',
        '',
        'import android.app.Activity;',
        'import android.app.AlertDialog;',
        'import android.content.Intent;',
        'import android.graphics.Bitmap;',
        'import android.graphics.Color;',
        'import android.net.Uri;',
      ];
      if (optCamera) {
        mainImports.push('import android.os.Environment;');
        mainImports.push('import android.provider.MediaStore;');
        mainImports.push('import androidx.core.content.FileProvider;');
        mainImports.push('import java.io.File;');
        mainImports.push('import java.text.SimpleDateFormat;');
        mainImports.push('import java.util.Date;');
        mainImports.push('import java.util.Locale;');
      }
      mainImports.push('import android.os.Build;');
      mainImports.push('import android.os.Bundle;');
      mainImports.push('import android.view.KeyEvent;');
      mainImports.push('import android.view.View;');
      mainImports.push('import android.view.Window;');
      mainImports.push('import android.view.WindowManager;');
      mainImports.push('import android.webkit.*;');
      mainImports.push('import android.widget.Toast;');
      mainImports.push('import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;');
      mainImports.push('');

      var mainFields = [
        'public class MainActivity extends Activity {',
        '    private WebView webView;',
        '    private SwipeRefreshLayout swipeRefresh;',
        '    private boolean isErrorPage = false;',
        '    private ValueCallback<Uri[]> fileCallback;',
        '    private static final int FILE_CHOOSER_RC = 1;',
      ];
      if (optCamera) {
        mainFields.push('    private Uri photoUri;');
        mainFields.push('    private static final int CAMERA_RC = 2;');
      }
      mainFields.push('');

      var mainMethods = [];

      // Camera method
      if (optCamera) {
        mainMethods.push('    public void openCamera() {');
        mainMethods.push('        try {');
        mainMethods.push('            Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);');
        mainMethods.push('            File photoFile = new File(getExternalFilesDir(Environment.DIRECTORY_PICTURES),');
        mainMethods.push('                "GC_" + new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date()) + ".jpg");');
        mainMethods.push('            photoUri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", photoFile);');
        mainMethods.push('            intent.putExtra(MediaStore.EXTRA_OUTPUT, photoUri);');
        mainMethods.push('            startActivityForResult(intent, CAMERA_RC);');
        mainMethods.push('        } catch (Exception e) {');
        mainMethods.push('            Toast.makeText(this, "Erreur camera", Toast.LENGTH_SHORT).show();');
        mainMethods.push('        }');
        mainMethods.push('    }');
        mainMethods.push('');
      }

      // onActivityResult
      mainMethods.push('    @Override');
      mainMethods.push('    protected void onActivityResult(int requestCode, int resultCode, Intent data) {');
      mainMethods.push('        super.onActivityResult(requestCode, resultCode, data);');
      mainMethods.push('        if (requestCode == FILE_CHOOSER_RC) {');
      mainMethods.push('            if (fileCallback != null) {');
      mainMethods.push('                Uri[] result = (resultCode == RESULT_OK && data != null) ? new Uri[]{data.getData()} : null;');
      mainMethods.push('                fileCallback.onReceiveValue(result);');
      mainMethods.push('                fileCallback = null;');
      mainMethods.push('            }');
      mainMethods.push('        }');
      if (optCamera) {
        mainMethods.push('        if (requestCode == CAMERA_RC) {');
        mainMethods.push('            if (resultCode == RESULT_OK && photoUri != null) {');
        // FIX: Use double-quoted push to avoid single-quote escaping conflict
        mainMethods.push("                String camJs = \"if(window.AndroidBridge&&AndroidBridge.onCameraResult)AndroidBridge.onCameraResult('\" + photoUri.toString() + \"')\";");
        mainMethods.push('                webView.evaluateJavascript(camJs, null);');
        mainMethods.push('            }');
        mainMethods.push('        }');
      }
      mainMethods.push('    }');
      mainMethods.push('');

      // onCreate
      mainMethods.push('    @Override');
      mainMethods.push('    protected void onCreate(Bundle savedInstanceState) {');
      mainMethods.push('        super.onCreate(savedInstanceState);');
      mainMethods.push('        requestWindowFeature(Window.FEATURE_NO_TITLE);');
      mainMethods.push('        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {');
      mainMethods.push('            getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);');
      mainMethods.push('            getWindow().setStatusBarColor(Color.parseColor("#' + hex + '"));');
      mainMethods.push('            getWindow().setNavigationBarColor(Color.parseColor("#' + hex + '"));');
      mainMethods.push('        }');
      mainMethods.push('        setContentView(R.layout.activity_main);');
      mainMethods.push('        swipeRefresh = findViewById(R.id.swipeRefresh);');
      mainMethods.push('        webView = findViewById(R.id.webView);');
      mainMethods.push('        setupWebView();');
      mainMethods.push('        setupSwipeRefresh();');
      mainMethods.push('        webView.loadUrl("file:///android_asset/www/index.html");');
      mainMethods.push('    }');
      mainMethods.push('');

      // setupWebView
      mainMethods.push('    private void setupWebView() {');
      mainMethods.push('        WebView.setWebContentsDebuggingEnabled(false);');
      mainMethods.push('        WebSettings s = webView.getSettings();');
      mainMethods.push('        s.setJavaScriptEnabled(true);');
      mainMethods.push('        s.setDomStorageEnabled(true);');
      mainMethods.push('        s.setDatabaseEnabled(true);');
      mainMethods.push('        s.setAllowFileAccess(false);');
      mainMethods.push('        s.setAllowContentAccess(true);');
      mainMethods.push('        s.setAllowFileAccessFromFileURLs(false);');
      mainMethods.push('        s.setAllowUniversalAccessFromFileURLs(false);');
      mainMethods.push('        s.setCacheMode(WebSettings.LOAD_DEFAULT);');
      mainMethods.push('        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);');
      mainMethods.push('        s.setUseWideViewPort(true);');
      mainMethods.push('        s.setLoadWithOverviewMode(true);');
      mainMethods.push('        s.setSaveFormData(false);');
      mainMethods.push('        s.setSavePassword(false);');
      if (optGeoloc) {
        mainMethods.push('        s.setGeolocationEnabled(true);');
      } else {
        mainMethods.push('        s.setGeolocationEnabled(false);');
      }
      mainMethods.push('');
      mainMethods.push('        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidBridge");');
      mainMethods.push('');
      mainMethods.push('        webView.setWebViewClient(new WebViewClient() {');
      mainMethods.push('            @Override');
      mainMethods.push('            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {');
      mainMethods.push('                String url = req.getUrl().toString();');
      mainMethods.push('                if (url.startsWith("file:///android_asset/")) return false;');
      mainMethods.push('                if (url.startsWith("https://")) {');
      mainMethods.push('                    try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception e) {}');
      mainMethods.push('                    return true;');
      mainMethods.push('                }');
      mainMethods.push('                return true;');
      mainMethods.push('            }');
      mainMethods.push('');
      mainMethods.push('            @Override');
      mainMethods.push('            public void onPageStarted(WebView v, String url, Bitmap favicon) {');
      mainMethods.push('                super.onPageStarted(v, url, favicon);');
      mainMethods.push('                isErrorPage = false;');
      mainMethods.push('            }');
      mainMethods.push('');
      mainMethods.push('            @Override');
      mainMethods.push('            public void onPageFinished(WebView v, String url) {');
      mainMethods.push('                super.onPageFinished(v, url);');
      mainMethods.push('                swipeRefresh.setRefreshing(false);');
      mainMethods.push('            }');
      mainMethods.push('');
      mainMethods.push('            @Override');
      mainMethods.push('            public void onReceivedError(WebView v, WebResourceRequest req, WebResourceError err) {');
      mainMethods.push('                super.onReceivedError(v, req, err);');
      mainMethods.push('                if (req.isForMainFrame()) { isErrorPage = true; showErrorPage(); }');
      mainMethods.push('            }');
      mainMethods.push('        });');
      mainMethods.push('');
      mainMethods.push('        webView.setWebChromeClient(new WebChromeClient() {');
      mainMethods.push('            @Override public boolean onConsoleMessage(ConsoleMessage m) { return true; }');
      mainMethods.push('');
      mainMethods.push('            @Override');
      mainMethods.push('            public boolean onShowFileChooser(WebView wv, ValueCallback<Uri[]> cb, FileChooserParams p) {');
      mainMethods.push('                if (fileCallback != null) fileCallback.onReceiveValue(null);');
      mainMethods.push('                fileCallback = cb;');
      mainMethods.push('                try { startActivityForResult(p.createIntent(), FILE_CHOOSER_RC); }');
      mainMethods.push('                catch (Exception e) { fileCallback = null; }');
      mainMethods.push('                return true;');
      mainMethods.push('            }');
      if (optGeoloc) {
        mainMethods.push('');
        mainMethods.push('            @Override');
        mainMethods.push('            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {');
        mainMethods.push('                callback.invoke(origin, true, false);');
        mainMethods.push('            }');
      }
      if (optCamera) {
        mainMethods.push('');
        mainMethods.push('            @Override');
        mainMethods.push('            public void onPermissionRequest(PermissionRequest request) {');
        mainMethods.push('                request.grant(request.getResources());');
        mainMethods.push('            }');
      }
      mainMethods.push('        });');
      mainMethods.push('');
      mainMethods.push('        webView.setDownloadListener((dlUrl, dlUa, dlCd, dlMt, dlCl) -> {');
      mainMethods.push('            try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(dlUrl))); }');
      mainMethods.push('            catch (Exception e) { Toast.makeText(MainActivity.this, "Download non supporte", Toast.LENGTH_SHORT).show(); }');
      mainMethods.push('        });');
      mainMethods.push('        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);');
      mainMethods.push('    }');
      mainMethods.push('');

      // setupSwipeRefresh
      mainMethods.push('    private void setupSwipeRefresh() {');
      mainMethods.push('        swipeRefresh.setColorSchemeColors(Color.parseColor("#00ff41"));');
      mainMethods.push('        swipeRefresh.setProgressBackgroundColorSchemeColor(Color.parseColor("#0a0a0a"));');
      mainMethods.push('        swipeRefresh.setOnRefreshListener(new SwipeRefreshLayout.OnRefreshListener() {');
      mainMethods.push('            @Override public void onRefresh() {');
      mainMethods.push('                if (isErrorPage) webView.loadUrl("file:///android_asset/www/index.html");');
      mainMethods.push('                else webView.reload();');
      mainMethods.push('            }');
      mainMethods.push('        });');
      mainMethods.push('    }');
      mainMethods.push('');

      // showErrorPage — use StringBuilder to avoid escaping issues
      mainMethods.push('    private void showErrorPage() {');
      mainMethods.push('        StringBuilder sb = new StringBuilder();');
      mainMethods.push('        sb.append("<html><body style=\\"background:#060606;color:#c8c8c8;font-family:monospace;");');
      mainMethods.push('        sb.append("display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center\\">");');
      mainMethods.push('        sb.append("<div><div style=\\"font-size:2rem;color:#ff0040;margin-bottom:16px\\">X</div>");');
      mainMethods.push('        sb.append("<h2 style=\\"color:#00ff41;font-size:1.2rem\\">Connexion perdue</h2>");');
      mainMethods.push('        sb.append("<p style=\\"color:#888;font-size:0.8rem;margin-bottom:20px\\">Verifiez votre connexion.</p>");');
      mainMethods.push('        sb.append("<a href=\\"file:///android_asset/www/index.html\\" style=\\"display:inline-block;padding:10px 24px;");');
      mainMethods.push('        sb.append("background:#00ff41;color:#000;font-weight:bold;border-radius:4px\\">Reessayer</a></div></body></html>");');
      mainMethods.push('        webView.loadData(sb.toString(), "text/html", "utf-8");');
      mainMethods.push('    }');
      mainMethods.push('');

      // onKeyDown
      mainMethods.push('    @Override');
      mainMethods.push('    public boolean onKeyDown(int keyCode, KeyEvent event) {');
      mainMethods.push('        if (keyCode == KeyEvent.KEYCODE_BACK) {');
      mainMethods.push('            if (webView.canGoBack()) { webView.goBack(); return true; }');
      mainMethods.push('            new AlertDialog.Builder(this)');
      mainMethods.push('                .setTitle("' + appName.replace(/"/g, '\\"') + '")');
      mainMethods.push('                .setMessage("Quitter ?")');
      mainMethods.push('                .setPositiveButton("Quitter", (d, w) -> finish())');
      mainMethods.push('                .setNegativeButton("Annuler", null)');
      mainMethods.push('                .show();');
      mainMethods.push('            return true;');
      mainMethods.push('        }');
      mainMethods.push('        return super.onKeyDown(keyCode, event);');
      mainMethods.push('    }');
      mainMethods.push('');

      // lifecycle
      mainMethods.push('    @Override protected void onResume() { super.onResume(); if (webView != null) webView.onResume(); }');
      mainMethods.push('    @Override protected void onPause() { super.onPause(); if (webView != null) webView.onPause(); }');
      mainMethods.push('    @Override protected void onDestroy() {');
      mainMethods.push('        if (webView != null) { webView.clearHistory(); webView.clearCache(true); webView.clearFormData(); webView.destroy(); }');
      mainMethods.push('        super.onDestroy();');
      mainMethods.push('    }');
      mainMethods.push('}');

      var mainActivity = mainImports.join('\n') + '\n' + mainFields.join('\n') + '\n' + mainMethods.join('\n');
      zip.file(root + '/app/src/main/java/' + pkgPath + '/MainActivity.java', mainActivity);
      updateProgress(++done, totalFiles, progressBar, progressText);

      // ── SplashActivity.java ──
      var splashLines = [
        'package ' + pkg + ';',
        '',
        'import android.app.Activity;',
        'import android.content.Intent;',
        'import android.graphics.Color;',
        'import android.os.Build;',
        'import android.os.Bundle;',
        'import android.os.Handler;',
        'import android.os.Looper;',
        'import android.view.Window;',
        'import android.view.WindowManager;',
        'import android.view.animation.AlphaAnimation;',
        'import android.widget.TextView;',
        '',
        'public class SplashActivity extends Activity {',
        '    @Override',
        '    protected void onCreate(Bundle savedInstanceState) {',
        '        super.onCreate(savedInstanceState);',
        '        requestWindowFeature(Window.FEATURE_NO_TITLE);',
        '        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {',
        '            getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);',
        '            getWindow().setStatusBarColor(Color.parseColor("#' + hex + '"));',
        '            getWindow().setNavigationBarColor(Color.parseColor("#' + hex + '"));',
        '        }',
        '        setContentView(R.layout.activity_splash);',
        '        TextView title = findViewById(R.id.splashTitle);',
        '        AlphaAnimation fadeIn = new AlphaAnimation(0f, 1f);',
        '        fadeIn.setDuration(800);',
        '        fadeIn.setFillAfter(true);',
        '        title.startAnimation(fadeIn);',
        '        new Handler(Looper.getMainLooper()).postDelayed(() -> {',
        '            startActivity(new Intent(this, MainActivity.class));',
        '            finish();',
        '            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);',
        '        }, 2000);',
        '    }',
        '}'
      ];
      zip.file(root + '/app/src/main/java/' + pkgPath + '/SplashActivity.java', splashLines.join('\n'));
      updateProgress(++done, totalFiles, progressBar, progressText);

      // ── WebAppInterface.java ──
      var waiImports = [
        'package ' + pkg + ';',
        '',
        'import android.app.Activity;',
        'import android.content.ClipData;',
        'import android.content.ClipboardManager;',
        'import android.content.Context;',
        'import android.content.Intent;',
        'import android.net.ConnectivityManager;',
        'import android.net.NetworkInfo;',
        'import android.net.Uri;',
        'import android.os.BatteryManager;',
        'import android.os.Build;',
        'import android.os.VibrationEffect;',
        'import android.os.Vibrator;',
        'import android.webkit.JavascriptInterface;',
        'import android.widget.Toast;',
      ];
      if (optNotif) {
        waiImports.push('import android.app.NotificationChannel;');
        waiImports.push('import android.app.NotificationManager;');
        waiImports.push('import android.app.PendingIntent;');
        waiImports.push('import androidx.core.app.NotificationCompat;');
      }
      if (optBiometric) {
        waiImports.push('import androidx.biometric.BiometricManager;');
        waiImports.push('import androidx.biometric.BiometricPrompt;');
      }
      waiImports.push('');

      var waiBody = [
        'public class WebAppInterface {',
        '    private final Activity activity;',
        '',
        '    public WebAppInterface(Activity a) { this.activity = a; }',
        '',
        '    @JavascriptInterface',
        '    public void showToast(String msg) {',
        '        activity.runOnUiThread(() -> Toast.makeText(activity, msg, Toast.LENGTH_SHORT).show());',
        '    }',
        '',
        '    @JavascriptInterface',
        '    public void copyToClipboard(String text) {',
        '        ((ClipboardManager) activity.getSystemService(Context.CLIPBOARD_SERVICE))',
        '            .setPrimaryClip(ClipData.newPlainText("Gold_Crew", text));',
        '        activity.runOnUiThread(() -> Toast.makeText(activity, "Copie!", Toast.LENGTH_SHORT).show());',
        '    }',
        '',
        '    @JavascriptInterface',
        '    public String getClipboard() {',
        '        try {',
        '            ClipData c = ((ClipboardManager) activity.getSystemService(Context.CLIPBOARD_SERVICE)).getPrimaryClip();',
        '            if (c != null && c.getItemCount() > 0) return c.getItemAt(0).coerceToText(activity).toString();',
        '        } catch (Exception e) {}',
        '        return "";',
        '    }',
        '',
        '    @JavascriptInterface',
        '    public void vibrate(int ms) {',
        '        Vibrator v = (Vibrator) activity.getSystemService(Context.VIBRATOR_SERVICE);',
        '        if (v != null) {',
        '            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)',
        '                v.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));',
        '            else v.vibrate(ms);',
        '        }',
        '    }',
        '',
        '    @JavascriptInterface',
        '    public boolean isOnline() {',
        '        NetworkInfo info = ((ConnectivityManager) activity.getSystemService(Context.CONNECTIVITY_SERVICE)).getActiveNetworkInfo();',
        '        return info != null && info.isConnected();',
        '    }',
        '',
        '    @JavascriptInterface',
        '    public String getNetworkType() {',
        '        NetworkInfo info = ((ConnectivityManager) activity.getSystemService(Context.CONNECTIVITY_SERVICE)).getActiveNetworkInfo();',
        '        if (info == null || !info.isConnected()) return "offline";',
        '        return info.getTypeName();',
        '    }',
        '',
        '    @JavascriptInterface',
        '    public int getBatteryLevel() {',
        '        return ((BatteryManager) activity.getSystemService(Context.BATTERY_SERVICE))',
        '            .getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);',
        '    }',
        '',
        '    @JavascriptInterface',
        '    public String getAppVersion() {',
        '        try { return activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0).versionName; }',
        '        catch (Exception e) { return "1.0.0"; }',
        '    }',
        '',
        '    @JavascriptInterface',
        '    public String getAppName() { return "' + appName.replace(/"/g, '\\"') + '"; }',
        '',
        '    @JavascriptInterface',
        '    public boolean isAndroid() { return true; }',
        '',
        '    @JavascriptInterface',
        '    public void shareText(String title, String text) {',
        '        Intent i = new Intent(Intent.ACTION_SEND);',
        '        i.setType("text/plain");',
        '        i.putExtra(Intent.EXTRA_SUBJECT, title);',
        '        i.putExtra(Intent.EXTRA_TEXT, text);',
        '        activity.startActivity(Intent.createChooser(i, "Partager via"));',
        '    }',
        '',
        '    @JavascriptInterface',
        '    public void shareImage(String uri, String title) {',
        '        try {',
        '            Intent i = new Intent(Intent.ACTION_SEND);',
        '            i.setType("image/*");',
        '            i.putExtra(Intent.EXTRA_STREAM, Uri.parse(uri));',
        '            activity.startActivity(Intent.createChooser(i, "Partager via"));',
        '        } catch (Exception e) {}',
        '    }',
      ];

      // Camera bridge
      if (optCamera) {
        waiBody.push('');
        waiBody.push('    @JavascriptInterface');
        waiBody.push('    public void openCamera() {');
        waiBody.push('        activity.runOnUiThread(() -> {');
        waiBody.push('            try { ((MainActivity) activity).openCamera(); }');
        waiBody.push('            catch (Exception e) { showToast("Erreur camera"); }');
        waiBody.push('        });');
        waiBody.push('    }');
      }

      // Biometric bridge
      if (optBiometric) {
        waiBody.push('');
        waiBody.push('    @JavascriptInterface');
        waiBody.push('    public boolean isBiometricAvailable() {');
        waiBody.push('        try { return BiometricManager.from(activity).canAuthenticate() == BiometricManager.BIOMETRIC_SUCCESS; }');
        waiBody.push('        catch (Exception e) { return false; }');
        waiBody.push('    }');
        waiBody.push('');
        waiBody.push('    @JavascriptInterface');
        waiBody.push('    public void authenticateBiometric(String title, String subtitle) {');
        waiBody.push('        activity.runOnUiThread(() -> {');
        waiBody.push('            try {');
        waiBody.push('                new BiometricPrompt(activity, java.util.concurrent.Executors.newSingleThreadExecutor(),');
        waiBody.push('                    new BiometricPrompt.AuthenticationCallback() {');
        waiBody.push('                        @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult r) {');
        waiBody.push('                            activity.runOnUiThread(() -> showToast("Authentifie !"));');
        waiBody.push('                        }');
        waiBody.push('                        @Override public void onAuthenticationError(int code, CharSequence err) {');
        waiBody.push('                            activity.runOnUiThread(() -> showToast("" + err));');
        waiBody.push('                        }');
        waiBody.push('                        @Override public void onAuthenticationFailed() {}');
        waiBody.push('                    }');
        waiBody.push('                ).authenticate(');
        waiBody.push('                    new BiometricPrompt.PromptInfo.Builder()');
        waiBody.push('                        .setTitle(title != null ? title : "Authentification")');
        waiBody.push('                        .setSubtitle(subtitle != null ? subtitle : "Confirmez identite")');
        waiBody.push('                        .setNegativeButtonText("Annuler")');
        waiBody.push('                        .build()');
        waiBody.push('                );');
        waiBody.push('            } catch (Exception e) { showToast("Biometrie indisponible"); }');
        waiBody.push('        });');
        waiBody.push('    }');
      }

      // Notification bridge
      if (optNotif) {
        waiBody.push('');
        waiBody.push('    @JavascriptInterface');
        waiBody.push('    public void sendNotification(String title, String message, int id) {');
        waiBody.push('        try {');
        waiBody.push('            String channelId = "gc_main";');
        waiBody.push('            NotificationManager nm = (NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);');
        waiBody.push('            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {');
        waiBody.push('                nm.createNotificationChannel(new NotificationChannel(channelId, "Gold_Crew", NotificationManager.IMPORTANCE_DEFAULT));');
        waiBody.push('            }');
        waiBody.push('            Intent intent = new Intent(activity, MainActivity.class);');
        waiBody.push('            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);');
        waiBody.push('            PendingIntent pi = PendingIntent.getActivity(activity, id, intent, PendingIntent.FLAG_IMMUTABLE);');
        waiBody.push('            nm.notify(id, new NotificationCompat.Builder(activity, channelId)');
        waiBody.push('                .setSmallIcon(android.R.drawable.ic_dialog_info)');
        waiBody.push('                .setContentTitle(title)');
        waiBody.push('                .setContentText(message)');
        waiBody.push('                .setAutoCancel(true)');
        waiBody.push('                .setContentIntent(pi)');
        waiBody.push('                .build());');
        waiBody.push('        } catch (Exception e) {}');
        waiBody.push('    }');
        waiBody.push('');
        waiBody.push('    @JavascriptInterface');
        waiBody.push('    public void cancelNotification(int id) {');
        waiBody.push('        ((NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE)).cancel(id);');
        waiBody.push('    }');
      }

      waiBody.push('}');

      var webAppInterface = waiImports.join('\\n') + '\\n' + waiBody.join('\\n');
      zip.file(root + '/app/src/main/java/' + pkgPath + '/WebAppInterface.java', webAppInterface);
      updateProgress(++done, totalFiles, progressBar, progressText);

      // ── Layouts ──
      zip.file(root + '/app/src/main/res/layout/activity_main.xml', javaLines([
        '<?xml version="1.0" encoding="utf-8"?>',
        '<androidx.swiperefreshlayout.widget.SwipeRefreshLayout',
        '    xmlns:android="http://schemas.android.com/apk/res/android"',
        '    android:id="@+id/swipeRefresh"',
        '    android:layout_width="match_parent"',
        '    android:layout_height="match_parent">',
        '',
        '    <WebView',
        '        android:id="@+id/webView"',
        '        android:layout_width="match_parent"',
        '        android:layout_height="match_parent"',
        '        android:background="#' + hex + '" />',
        '',
        '</androidx.swiperefreshlayout.widget.SwipeRefreshLayout>'
      ]));

      zip.file(root + '/app/src/main/res/layout/activity_splash.xml', javaLines([
        '<?xml version="1.0" encoding="utf-8"?>',
        '<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"',
        '    android:layout_width="match_parent"',
        '    android:layout_height="match_parent"',
        '    android:background="@drawable/splash_background"',
        '    android:gravity="center"',
        '    android:orientation="vertical">',
        '',
        '    <TextView',
        '        android:id="@+id/splashTitle"',
        '        android:layout_width="wrap_content"',
        '        android:layout_height="wrap_content"',
        '        android:text="GOLD_CREW"',
        '        android:textColor="#00ff41"',
        '        android:textSize="28sp"',
        '        android:textStyle="bold"',
        '        android:fontFamily="monospace"',
        '        android:letterSpacing="0.2"',
        '        android:alpha="0" />',
        '',
        '    <TextView',
        '        android:layout_width="wrap_content"',
        '        android:layout_height="wrap_content"',
        '        android:text="OSINT Platform"',
        '        android:textColor="#555555"',
        '        android:textSize="11sp"',
        '        android:fontFamily="monospace"',
        '        android:layout_marginTop="8dp" />',
        '',
        '    <ProgressBar',
        '        android:layout_width="24dp"',
        '        android:layout_height="24dp"',
        '        android:layout_marginTop="32dp"',
        '        android:indeterminateTint="#00ff41" />',
        '',
        '    <TextView',
        '        android:layout_width="wrap_content"',
        '        android:layout_height="wrap_content"',
        '        android:text="Chargement..."',
        '        android:textColor="#444444"',
        '        android:textSize="10sp"',
        '        android:fontFamily="monospace"',
        '        android:layout_marginTop="12dp" />',
        '',
        '</LinearLayout>'
      ]));
      updateProgress(++done, totalFiles, progressBar, progressText);

      // ── Values ──
      zip.file(root + '/app/src/main/res/values/strings.xml',
        '<?xml version="1.0" encoding="utf-8"?>\\n<resources>\\n    <string name="app_name">' + appName + '</string>\\n</resources>');
      zip.file(root + '/app/src/main/res/values/colors.xml', javaLines([
        '<?xml version="1.0" encoding="utf-8"?>',
        '<resources>',
        '    <color name="colorPrimary">#00ff41</color>',
        '    <color name="colorPrimaryDark">#' + hex + '</color>',
        '    <color name="colorAccent">#00e5ff</color>',
        '    <color name="colorBackground">#' + hex + '</color>',
        '</resources>'
      ]));
      zip.file(root + '/app/src/main/res/values/styles.xml', javaLines([
        '<?xml version="1.0" encoding="utf-8"?>',
        '<resources>',
        '    <style name="AppTheme" parent="@android:style/Theme.DeviceDefault.NoActionBar">',
        '        <item name="android:windowBackground">@color/colorBackground</item>',
        '        <item name="android:statusBarColor">@color/colorPrimaryDark</item>',
        '        <item name="android:navigationBarColor">@color/colorPrimaryDark</item>',
        '    </style>',
        '    <style name="SplashTheme" parent="@android:style/Theme.DeviceDefault.NoActionBar">',
        '        <item name="android:windowBackground">@drawable/splash_background</item>',
        '        <item name="android:statusBarColor">@color/colorPrimaryDark</item>',
        '        <item name="android:navigationBarColor">@color/colorPrimaryDark</item>',
        '    </style>',
        '</resources>'
      ]));
      updateProgress(++done, totalFiles, progressBar, progressText);

      // ── Drawables & XML ──
      zip.file(root + '/app/src/main/res/drawable/splash_background.xml',
        '<?xml version="1.0" encoding="utf-8"?>\\n<layer-list xmlns:android="http://schemas.android.com/apk/res/android">\\n    <item android:drawable="@color/colorBackground" />\\n</layer-list>');

      zip.file(root + '/app/src/main/res/drawable/ic_launcher_foreground.xml', javaLines([
        '<?xml version="1.0" encoding="utf-8"?>',
        '<vector xmlns:android="http://schemas.android.com/apk/res/android"',
        '    android:width="108dp" android:height="108dp"',
        '    android:viewportWidth="108" android:viewportHeight="108">',
        '    <group android:translateX="22" android:translateY="22">',
        '        <path android:fillColor="#00ff41"',
        '            android:pathData="M32,4 L36,4 L36,8 L40,10 L40,20 L36,28 L32,32 L28,28 L24,20 L24,10 L28,8 Z" />',
        '        <path android:fillColor="#' + hex + '"',
        '            android:pathData="M28,14 Q32,10 36,14 Q32,20 28,14 Z M32,13 A2,2 0 1,1 32,17 A2,2 0 1,1 32,13 Z" />',
        '    </group>',
        '</vector>'
      ]));

      zip.file(root + '/app/src/main/res/drawable/ic_launcher_background.xml', javaLines([
        '<?xml version="1.0" encoding="utf-8"?>',
        '<vector xmlns:android="http://schemas.android.com/apk/res/android"',
        '    android:width="108dp" android:height="108dp"',
        '    android:viewportWidth="108" android:viewportHeight="108">',
        '    <path android:fillColor="#' + hex + '" android:pathData="M0,0h108v108h-108z" />',
        '</vector>'
      ]));

      zip.file(root + '/app/src/main/res/xml/network_security_config.xml',
        '<?xml version="1.0" encoding="utf-8"?>\\n<network-security-config>\\n    <base-config cleartextTrafficPermitted="false">\\n        <trust-anchors>\\n            <certificates src="system" />\\n        </trust-anchors>\\n    </base-config>\\n</network-security-config>');

      if (optCamera) {
        zip.file(root + '/app/src/main/res/xml/file_paths.xml',
          '<?xml version="1.0" encoding="utf-8"?>\\n<paths>\\n    <external-files-path name="photos" path="Pictures" />\\n    <cache-path name="cache" path="/" />\\n</paths>');
      }
      updateProgress(++done, totalFiles, progressBar, progressText);

      // ── Mipmap icons ──
      var iconXml = '<?xml version="1.0" encoding="utf-8"?>\\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\\n    <background android:drawable="@drawable/ic_launcher_background" />\\n    <foreground android:drawable="@drawable/ic_launcher_foreground" />\\n</adaptive-icon>';
      var densities = ['mipmap-hdpi', 'mipmap-mdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
      densities.forEach(function(d) {
        zip.file(root + '/app/src/main/res/' + d + '/ic_launcher.xml', iconXml);
        zip.file(root + '/app/src/main/res/' + d + '/ic_launcher_round.xml', iconXml);
      });
      updateProgress(++done, totalFiles, progressBar, progressText);

      // ── ProGuard ──
      zip.file(root + '/app/proguard-rules.pro', javaLines([
        '-keepattributes JavascriptInterface',
        '-keepattributes *Annotation*',
        '-keepclassmembers class ' + pkg + '.WebAppInterface {',
        '    @android.webkit.JavascriptInterface <methods>;',
        '}',
        "-repackageclasses ''",
        '-allowaccessmodification',
        '-overloadaggressively',
        '-assumenosideeffects class android.util.Log {',
        '    public static int v(...);',
        '    public static int d(...);',
        '    public static int i(...);',
        '    public static int w(...);',
        '    public static int e(...);',
        '}',
        '-keep class androidx.** { *; }',
        '-dontwarn androidx.**',
        '-keep class android.webkit.** { *; }',
        '-dontwarn android.webkit.**'
      ]));
      updateProgress(++done, totalFiles, progressBar, progressText);

      // ── .gitignore + README ──
      zip.file(root + '/.gitignore', '*.iml\\n.gradle\\n/local.properties\\n/.idea\\n.DS_Store\\n/build\\n*.apk\\n');
      zip.file(root + '/README.md', javaLines([
        '# ' + appName,
        '',
        '> Application Android native - Plateforme OSINT',
        '',
        '| Package | `' + pkg + '` | Version | ' + version + ' | SDK | ' + minSdk + ' -> 34 |',
        '| Camera | ' + (optCamera ? 'Oui' : 'Non') + ' | Biometrie | ' + (optBiometric ? 'Oui' : 'Non') + ' | Notif | ' + (optNotif ? 'Oui' : 'Non') + ' | Geoloc | ' + (optGeoloc ? 'Oui' : 'Non') + ' |',
        '',
        '## Compilation',
        '1. Android Studio -> Sync Gradle -> Build APK(s)',
        '',
        '## Securite',
        'JS obfusque - ProGuard debug+release - WebView locked - Backup disabled',
        '',
        new Date().getFullYear() + ' ' + appName + ' - Mcamara'
      ]));
      updateProgress(++done, totalFiles, progressBar, progressText);

      // ── Embed web files ──
      progressLabel.textContent = 'Intégration fichiers web (obfuscation)...';
      var failedCount = 0;
      var obfuscatedCount = 0;
      for (var fi = 0; fi < WEB_FILES.length; fi++) {
        var filePath = WEB_FILES[fi];
        try {
          var content = await readFileRobust(filePath);
          if (filePath.endsWith('.js')) {
            zip.file(root + '/app/src/main/assets/www/' + filePath, obfusJS(content));
            obfuscatedCount++;
          } else {
            zip.file(root + '/app/src/main/assets/www/' + filePath, content);
          }
        } catch (e) {
          zip.file(root + '/app/src/main/assets/www/' + filePath, '/* file unavailable */');
          failedCount++;
        }
        updateProgress(++done, totalFiles, progressBar, progressText);
      }

      // ── Generate ZIP ──
      progressLabel.textContent = 'Compression...';
      status.textContent = 'Compression...';
      status.style.color = 'var(--gold)';

      var blob = await zip.generateAsync(
        { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } },
        function(metadata) {
          var pct = Math.round(metadata.percent);
          progressText.textContent = pct + '%';
          progressBar.style.width = pct + '%';
        }
      );

      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = safeName + '_v' + version + '.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      progressWrap.style.display = 'none';
      var sizeMB = (blob.size / 1024 / 1024).toFixed(1);
      var okFiles = WEB_FILES.length - failedCount;
      status.innerHTML = '<span style="color:var(--green)">✓</span> <strong style="color:var(--text-primary)">Projet téléchargé</strong> <span style="color:var(--text-muted)">(' + sizeMB + ' Mo — ' + okFiles + ' fichiers, ' + obfuscatedCount + ' obfusqués)</span>';
      status.style.color = '';
      instructions.style.display = 'block';
      btn.innerHTML = '<span>✓</span> Téléchargé !';
      btn.className = 'btn btn-outline btn-lg';
      btn.style.borderColor = 'var(--gold)';
      btn.style.color = 'var(--gold)';

      setTimeout(function() {
        btn.disabled = false;
        btn.innerHTML = '<span>📱</span> Régénérer';
        btn.className = 'btn btn-gold btn-lg';
        btn.style.borderColor = '';
        btn.style.color = '';
      }, 4000);

    } catch (err) {
      status.textContent = '❌ ' + err.message;
      status.style.color = 'var(--red)';
      btn.disabled = false;
      btn.innerHTML = '<span>📱</span> Réessayer';
      progressWrap.style.display = 'none';
    }
  }

  return { render };
})();
window.AdminApkSubView = AdminApkSubView;