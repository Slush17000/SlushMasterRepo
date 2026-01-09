# Base64 (B64) Encryption & Decryption Methods.
# Author: Slush
# Date: 1/9/26

import base64

def B64Encryption(fileName, encryptedFileName):
    w = open(fileName, "rb")
    f = open(encryptedFileName, "wb")
    bytes = w.read()
    bytesToB64 = base64.b64encode(bytes)
    f.write(bytesToB64)
    f.close()
    w.close()

def B64Decryption(encryptedFileName, decryptedFileName):
    w = open(decryptedFileName, "wb")
    f = open(encryptedFileName, "rb")
    b64EncodedBytes = f.read()
    b64ToBytes = base64.b64decode(b64EncodedBytes)
    w.write(b64ToBytes)
    w.close()
    f.close()