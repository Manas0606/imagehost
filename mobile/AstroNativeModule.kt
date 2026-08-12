package com.astrosathi

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.biometrics.BiometricPrompt
import android.os.Build
import android.os.CancellationSignal
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONObject
import java.nio.charset.StandardCharsets
import java.security.KeyStore
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.UUID
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec

class AstroNativeModule(private val ctx: ReactApplicationContext): ReactContextBaseJavaModule(ctx) {
    override fun getName() = "AstroNative"
    private val prefs by lazy { ctx.getSharedPreferences("astrosathi_secure", Context.MODE_PRIVATE) }
    private val random = SecureRandom()

    companion object {
        private const val KEY_ALIAS = "astrosathi_local_vault_v2"
        private const val CHANNEL_ID = "astrosathi_updates"
        private const val NOTIFICATION_ID = 7301
    }

    @ReactMethod
    fun getBootstrap(p: Promise) {
        try {
            val out = Arguments.createMap()
            val accountRaw = read("account")
            out.putString("deviceId", device())
            out.putBoolean("accountExists", !accountRaw.isNullOrBlank())
            out.putBoolean("loggedIn", !accountRaw.isNullOrBlank() && prefs.getBoolean("session", false))
            if (!accountRaw.isNullOrBlank()) {
                val a = JSONObject(accountRaw)
                out.putString("name", a.optString("name"))
                out.putString("email", a.optString("email"))
            }
            val lock = read("lock")?.let { JSONObject(it) }
            out.putString("lockMode", lock?.optString("mode", "none") ?: "none")
            read("birth")?.let { out.putString("birthProfile", it) }
            p.resolve(out)
        } catch (e: Exception) {
            p.reject("BOOTSTRAP", e)
        }
    }

    @ReactMethod
    fun saveRemoteAccount(name: String, email: String, p: Promise) {
        try {
            val n = name.trim().ifBlank { "AstroSathi User" }
            val e = email.trim().lowercase()
            require(Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$").matches(e)) { "Invalid account email." }
            write("account", JSONObject().put("name", n).put("email", e).put("provider", "neon-auth").toString())
            prefs.edit().putBoolean("session", true).apply()
            p.resolve(true)
        } catch (e: Exception) {
            p.reject("SAVE_ACCOUNT", e)
        }
    }

    @ReactMethod
    fun logout(p: Promise) {
        prefs.edit().putBoolean("session", false).apply()
        p.resolve(true)
    }

    @ReactMethod
    fun saveBirthProfile(json: String, p: Promise) {
        try {
            JSONObject(json)
            write("birth", json)
            p.resolve(true)
        } catch (e: Exception) {
            p.reject("BIRTH_SAVE", e)
        }
    }

    @ReactMethod
    fun setAppLock(mode: String, secret: String, p: Promise) {
        try {
            require(mode in listOf("pin", "pattern", "biometric")) { "Unsupported lock type." }
            if (mode == "pin") require(Regex("^\\d{4,6}$").matches(secret)) { "PIN must contain 4 to 6 digits." }
            if (mode == "pattern") require(secret.split("-").filter { it.isNotBlank() }.distinct().size >= 4) { "Pattern must contain at least 4 different points." }
            val obj = JSONObject().put("mode", mode)
            if (mode != "biometric") {
                val salt = ByteArray(16).also { random.nextBytes(it) }
                obj.put("salt", Base64.encodeToString(salt, Base64.NO_WRAP))
                obj.put("hash", Base64.encodeToString(hash(secret, salt), Base64.NO_WRAP))
            }
            write("lock", obj.toString())
            p.resolve(true)
        } catch (e: Exception) {
            p.reject("SET_LOCK", e)
        }
    }

    @ReactMethod
    fun clearAppLock(p: Promise) {
        prefs.edit().remove("enc_lock").apply()
        p.resolve(true)
    }

    @ReactMethod
    fun verifyAppLock(secret: String, p: Promise) {
        try {
            val raw = read("lock") ?: return p.resolve(true)
            val j = JSONObject(raw)
            val mode = j.optString("mode", "none")
            require(mode == "pin" || mode == "pattern") { "Use biometric unlock for this lock type." }
            val salt = Base64.decode(j.getString("salt"), Base64.NO_WRAP)
            val expected = Base64.decode(j.getString("hash"), Base64.NO_WRAP)
            p.resolve(MessageDigest.isEqual(expected, hash(secret, salt)))
        } catch (e: Exception) {
            p.reject("VERIFY_LOCK", e)
        }
    }

    @ReactMethod
    fun authenticateBiometric(p: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            p.reject("BIOMETRIC", "Biometric app lock requires Android 9 or newer on this device.")
            return
        }
        val activity = currentActivity ?: run {
            p.reject("BIOMETRIC", "Biometric authentication is unavailable right now.")
            return
        }
        activity.runOnUiThread {
            try {
                val signal = CancellationSignal()
                val executor = ContextCompat.getMainExecutor(ctx)
                val prompt = BiometricPrompt.Builder(activity)
                    .setTitle("Unlock AstroSathi")
                    .setSubtitle("Use your fingerprint or face")
                    .setNegativeButton("Cancel", executor) { _, _ -> p.reject("BIOMETRIC_CANCELLED", "Biometric unlock cancelled.") }
                    .build()
                prompt.authenticate(signal, executor, object : BiometricPrompt.AuthenticationCallback() {
                    override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult?) {
                        super.onAuthenticationSucceeded(result)
                        p.resolve(true)
                    }
                    override fun onAuthenticationError(errorCode: Int, errString: CharSequence?) {
                        super.onAuthenticationError(errorCode, errString)
                        p.reject("BIOMETRIC", errString?.toString() ?: "Biometric authentication failed.")
                    }
                })
            } catch (e: Exception) {
                p.reject("BIOMETRIC", e)
            }
        }
    }

    @ReactMethod
    fun requestNotificationPermission(p: Promise) {
        try {
            createChannel()
            if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                currentActivity?.let { ActivityCompat.requestPermissions(it, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 5070) }
            }
            p.resolve(true)
        } catch (e: Exception) {
            p.reject("NOTIFICATION_PERMISSION", e)
        }
    }

    @ReactMethod
    fun showNotification(title: String, message: String, p: Promise) {
        try {
            createChannel()
            if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                p.resolve(false)
                return
            }
            val manager = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val notification = NotificationCompat.Builder(ctx, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .build()
            manager.notify(NOTIFICATION_ID, notification)
            p.resolve(true)
        } catch (e: Exception) {
            p.reject("NOTIFICATION", e)
        }
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(NotificationChannel(CHANNEL_ID, "AstroSathi updates", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Premium approval and AstroSathi status updates"
            })
        }
    }

    private fun hash(secret: String, salt: ByteArray): ByteArray =
        SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
            .generateSecret(PBEKeySpec(secret.toCharArray(), salt, 240000, 256)).encoded

    private fun device(): String {
        var v = prefs.getString("deviceId", null)
        if (v == null) {
            v = UUID.randomUUID().toString()
            prefs.edit().putString("deviceId", v).apply()
        }
        return v
    }

    private fun aes(): SecretKey {
        val ks = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (ks.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        generator.init(KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .build())
        return generator.generateKey()
    }

    private fun write(key: String, value: String) {
        val c = Cipher.getInstance("AES/GCM/NoPadding")
        c.init(Cipher.ENCRYPT_MODE, aes())
        val iv = c.iv
        val data = c.doFinal(value.toByteArray(StandardCharsets.UTF_8))
        val all = ByteArray(iv.size + data.size)
        System.arraycopy(iv, 0, all, 0, iv.size)
        System.arraycopy(data, 0, all, iv.size, data.size)
        prefs.edit().putString("enc_$key", Base64.encodeToString(all, Base64.NO_WRAP)).apply()
    }

    private fun read(key: String): String? {
        val encoded = prefs.getString("enc_$key", null) ?: return null
        return try {
            val all = Base64.decode(encoded, Base64.NO_WRAP)
            require(all.size > 28)
            val c = Cipher.getInstance("AES/GCM/NoPadding")
            c.init(Cipher.DECRYPT_MODE, aes(), GCMParameterSpec(128, all.copyOfRange(0, 12)))
            String(c.doFinal(all.copyOfRange(12, all.size)), StandardCharsets.UTF_8)
        } catch (_: Exception) { null }
    }
}
