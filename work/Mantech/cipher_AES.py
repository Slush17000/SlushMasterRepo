# Advanced Encryption Standard (AES) Encryption & Decryption Methods.
# Author: Slush
# Date: 1/9/26

from Crypto.Cipher import AES

def AESEncryption(fileName, encryptedFileName):
    w = open(fileName, "rb")
    f = open(encryptedFileName, "wb")
    bytes = w.read()
    key = b'incomprehensible'
    cipher = AES.new(key, AES.MODE_EAX)
    cipherText, tag = cipher.encrypt_and_digest(bytes)
    # Save nonce, tag, and ciphertext for decryption
    f.write(cipher.nonce)
    f.write(tag)
    f.write(cipherText)
    f.close()
    w.close()

def AESDecryption(encryptedFileName, decryptedFileName):
    f = open(encryptedFileName, "rb")
    w = open(decryptedFileName, "wb")
    # Read nonce (16 bytes), tag (16 bytes), then ciphertext
    nonce = f.read(16)
    tag = f.read(16)
    cipherText = f.read()
    key = b'incomprehensible'
    cipher = AES.new(key, AES.MODE_EAX, nonce=nonce)
    plainText = cipher.decrypt_and_verify(cipherText, tag)
    w.write(plainText)
    w.close()
    f.close()