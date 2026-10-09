# Exclusive OR (XOR) Encryption & Decryption Methods.
# Author: Slush
# Date: 1/9/26

import random

def XOREncryption(fileName, encryptedFileName):
    xorByte = random.randint(0, 255)
    with open(fileName, "rb") as input_file:
        file_bytes = input_file.read()
    with open(encryptedFileName, "wb") as output_file:
        for starting_byte in file_bytes:
            output_file.write(bytes([starting_byte ^ xorByte]))
    print("Your key for decryption is:", xorByte)
    return xorByte

def XORDecryption(encryptedFileName, decryptedFileName, key):
    with open(encryptedFileName, "rb") as input_file:
        encrypted_bytes = input_file.read()
    with open(decryptedFileName, "wb") as output_file:
        for starting_byte in encrypted_bytes:
            output_file.write(bytes([starting_byte ^ key]))