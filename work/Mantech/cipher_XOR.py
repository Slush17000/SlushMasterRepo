# Exclusive OR (XOR) Encryption & Decryption Methods.
# Author: Slush
# Date: 1/9/26

import random

def XOREncryption(fileName, encryptedFileName):
    w = open(fileName, "rb")
    f = open(encryptedFileName, "wb")
    xorByte = random.randint(0, 255)
    bytes = w.read()
    for i in range(len(bytes)):
        startingByte = bytes[i] # Stored as int
        finalByte = startingByte ^ xorByte
        writeByte = finalByte.to_bytes(1, "big") # Convert int to byte
        f.write(writeByte)
    print("Your key for decryption is:", xorByte)
    f.close()
    w.close()

def XORDecryption(encryptedFileName, decryptedFileName, key):
    w = open(decryptedFileName, "wb")
    f = open(encryptedFileName, "rb")
    xorByte = key
    bytes = f.read()
    for i in range(len(bytes)):
        startingByte = bytes[i] # Stored as int
        finalByte = startingByte ^ xorByte
        writeByte = finalByte.to_bytes(1, "big") # Convert int to byte
        w.write(writeByte)
    w.close()
    f.close()