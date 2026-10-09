# Advanced Encryption Standard (AES) Encryption & Decryption Methods.
# Author: Slush
# Date: 1/9/26

from Crypto.Cipher import AES

def AESEncryption(fileName, encryptedFileName):
    with open(fileName, "rb") as input_file:
        file_bytes = input_file.read()
    key = b'incomprehensible'
    cipher = AES.new(key, AES.MODE_EAX)
    cipherText, tag = cipher.encrypt_and_digest(file_bytes)
    # Save nonce, tag, and ciphertext for decryption
    with open(encryptedFileName, "wb") as output_file:
        output_file.write(cipher.nonce)
        output_file.write(tag)
        output_file.write(cipherText)

def AESDecryption(encryptedFileName, decryptedFileName):
    with open(encryptedFileName, "rb") as input_file:
        # Read nonce (16 bytes), tag (16 bytes), then ciphertext
        nonce = input_file.read(16)
        tag = input_file.read(16)
        cipherText = input_file.read()
    key = b'incomprehensible'
    cipher = AES.new(key, AES.MODE_EAX, nonce=nonce)
    plainText = cipher.decrypt_and_verify(cipherText, tag)
    with open(decryptedFileName, "wb") as output_file:
        output_file.write(plainText)