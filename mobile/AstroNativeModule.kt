package com.astrosathi

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONObject
import java.nio.charset.StandardCharsets
import java.security.KeyFactory
import java.security.KeyStore
import java.security.MessageDigest
import java.security.SecureRandom
import java.security.Signature
import java.security.spec.X509EncodedKeySpec
import java.util.UUID
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec

class AstroNativeModule(private val ctx: ReactApplicationContext):ReactContextBaseJavaModule(ctx){
 override fun getName()="AstroNative"
 private val prefs by lazy{ctx.getSharedPreferences("astrosathi_secure",Context.MODE_PRIVATE)}
 private val random=SecureRandom()
 companion object{
  private const val KEY_ALIAS="astrosathi_local_vault_v1"
  private const val PUBLIC_KEY_PEM="""-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxM0kSryRBfdYtKg4mAGY
FE2F2adu/OI1GqIgX2CLUxdZwyippoukINQuunC803gpByZbSyTdQftA+aqngu8d
xNn825iD927uDBSk/DeDKhS3SXWfLqJ/+KPHyjIriTZh17eicWmWjiKKjFnV4xVJ
KpnIpg3VLYDoCAuhPTj26FF1nNcFl7DcySCeGLEzHCAHnMaXoF/8BgGoSmS5KXC5
cwMpIC6RejIIGx7Jm/7PhQEPqCt42rXxLMZBJGKH57MG8d3gx2/H8CjTq8vxq3WR
vJpkRUuFQzBFeKmcvAVtbYfPOd9kL0Ae5QosMY1m4z2KZ8+zmctiT0XG5la2r7Jq
RQIDAQAB
-----END PUBLIC KEY-----"""
 }
 @ReactMethod fun getBootstrap(p:Promise){try{val o=Arguments.createMap();o.putString("deviceId",device());val raw=read("account");o.putBoolean("loggedIn",!raw.isNullOrBlank()&&prefs.getBoolean("session",false));if(!raw.isNullOrBlank()){val a=JSONObject(raw);o.putString("name",a.optString("name"));o.putString("email",a.optString("email"))};o.putBoolean("premium",prefs.getBoolean("premium",false));read("birth")?.let{o.putString("birthProfile",it)};p.resolve(o)}catch(e:Exception){p.reject("BOOTSTRAP",e)}}
 @ReactMethod fun register(name:String,email:String,password:String,p:Promise){try{val n=name.trim();val e=email.trim().lowercase();require(n.length>=2){"Name must contain at least 2 characters."};require(Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$").matches(e)){"Enter a valid email address."};require(password.length>=8){"Password must contain at least 8 characters."};val salt=ByteArray(16).also{random.nextBytes(it)};write("account",JSONObject().put("name",n).put("email",e).put("salt",Base64.encodeToString(salt,Base64.NO_WRAP)).put("hash",Base64.encodeToString(hash(password,salt),Base64.NO_WRAP)).toString());prefs.edit().putBoolean("session",true).apply();p.resolve(true)}catch(x:Exception){p.reject("REGISTER",x)}}
 @ReactMethod fun login(email:String,password:String,p:Promise){try{val raw=read("account")?:throw IllegalArgumentException("No AstroSathi account exists on this device yet.");val a=JSONObject(raw);val salt=Base64.decode(a.getString("salt"),Base64.NO_WRAP);require(email.trim().lowercase()==a.getString("email")&&MessageDigest.isEqual(Base64.decode(a.getString("hash"),Base64.NO_WRAP),hash(password,salt))){"Email or password is incorrect."};prefs.edit().putBoolean("session",true).apply();p.resolve(true)}catch(x:Exception){p.reject("LOGIN",x)}}
 @ReactMethod fun logout(p:Promise){prefs.edit().putBoolean("session",false).apply();p.resolve(true)}
 @ReactMethod fun saveBirthProfile(json:String,p:Promise){try{JSONObject(json);write("birth",json);p.resolve(true)}catch(x:Exception){p.reject("BIRTH_SAVE",x)}}
 @ReactMethod fun verifyActivation(token:String,p:Promise){try{val parts=token.trim().split('.');require(parts.size==2){"Invalid activation code format."};val payload=b64url(parts[0]);val sig=b64url(parts[1]);val keyText=PUBLIC_KEY_PEM.replace("-----BEGIN PUBLIC KEY-----","").replace("-----END PUBLIC KEY-----","").replace("\n","").replace("\r","");val key=KeyFactory.getInstance("RSA").generatePublic(X509EncodedKeySpec(Base64.decode(keyText,Base64.DEFAULT)));val v=Signature.getInstance("SHA256withRSA");v.initVerify(key);v.update(payload);require(v.verify(sig)){"Activation signature is invalid."};val j=JSONObject(String(payload,StandardCharsets.UTF_8));require(j.optInt("v")==1&&j.optString("product")=="FULL_REPORT"){"Activation product is invalid."};require(j.optString("deviceId")==device()){"This activation code belongs to another device."};val exp=j.optLong("expiresAt",0);require(exp==0L||System.currentTimeMillis()<exp){"This activation code has expired."};prefs.edit().putBoolean("premium",true).apply();write("entitlement",j.toString());p.resolve(true)}catch(x:Exception){p.reject("ACTIVATION",x)}}
 private fun hash(password:String,salt:ByteArray)=SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(PBEKeySpec(password.toCharArray(),salt,210000,256)).encoded
 private fun device():String{var v=prefs.getString("deviceId",null);if(v==null){v=UUID.randomUUID().toString();prefs.edit().putString("deviceId",v).apply()};return v}
 private fun aes():SecretKey{val ks=KeyStore.getInstance("AndroidKeyStore").apply{load(null)};(ks.getKey(KEY_ALIAS,null) as? SecretKey)?.let{return it};val g=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");g.init(KeyGenParameterSpec.Builder(KEY_ALIAS,KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).setKeySize(256).build());return g.generateKey()}
 private fun write(key:String,value:String){val c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,aes());val iv=c.iv;val d=c.doFinal(value.toByteArray(StandardCharsets.UTF_8));val b=ByteArray(iv.size+d.size);System.arraycopy(iv,0,b,0,iv.size);System.arraycopy(d,0,b,iv.size,d.size);prefs.edit().putString("enc_$key",Base64.encodeToString(b,Base64.NO_WRAP)).apply()}
 private fun read(key:String):String?{val enc=prefs.getString("enc_$key",null)?:return null;return try{val b=Base64.decode(enc,Base64.NO_WRAP);require(b.size>28);val c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,aes(),GCMParameterSpec(128,b.copyOfRange(0,12)));String(c.doFinal(b.copyOfRange(12,b.size)),StandardCharsets.UTF_8)}catch(_:Exception){null}}
 private fun b64url(v:String):ByteArray{var t=v.replace('-','+').replace('_','/');while(t.length%4!=0)t+="=";return Base64.decode(t,Base64.DEFAULT)}
}
