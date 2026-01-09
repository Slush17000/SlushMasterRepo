# Triple Data Encryption Standard (TDES) Encryption & Decryption Methods.
# Author: Slush
# Date: 1/9/26

from Crypto.Cipher import DES3
from hashlib import md5

def TDESEncryption(fileName, encryptedFileName, key):
    keyHash = md5(key.encode("ascii")).digest() #16 byte key
    TDESKey = DES3.adjust_key_parity(keyHash)
    cipher = DES3.new(TDESKey, DES3.MODE_EAX, nonce = b'0')
    with open(fileName, "rb") as inputFile:
        bytes = inputFile.read()
        TDESBytes = cipher.encrypt(bytes)
    with open(encryptedFileName, "wb") as outputFile:
        outputFile.write(TDESBytes)

def TDESDecryption(encryptedFileName, decryptedFileName, key):
    keyHash = md5(key.encode("ascii")).digest() #16 byte key
    TDESKey = DES3.adjust_key_parity(keyHash)
    cipher = DES3.new(TDESKey, DES3.MODE_EAX, nonce = b'0')
    with open(encryptedFileName, "rb") as inputFile:
        TDESBytes = inputFile.read()
        bytes = cipher.decrypt(TDESBytes)
    with open(decryptedFileName, "wb") as outputFile:
        outputFile.write(bytes)