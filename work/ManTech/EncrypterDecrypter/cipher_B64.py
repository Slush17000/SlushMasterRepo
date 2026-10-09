# Base64 (B64) Encryption & Decryption Methods.
# Author: Slush
# Date: 1/9/26

import base64

def B64Encryption(fileName, encryptedFileName):
    with open(fileName, "rb") as input_file:
        file_bytes = input_file.read()
    encoded_bytes = base64.b64encode(file_bytes)
    with open(encryptedFileName, "wb") as output_file:
        output_file.write(encoded_bytes)

def B64Decryption(encryptedFileName, decryptedFileName):
    with open(encryptedFileName, "rb") as input_file:
        encoded_bytes = input_file.read()
    decoded_bytes = base64.b64decode(encoded_bytes, validate=True)
    with open(decryptedFileName, "wb") as output_file:
        output_file.write(decoded_bytes)