# File Encryptor & Decryptor.
# Author: Slush
# Date: 1/9/26

import sys
import os
from cipher_XOR import XOREncryption, XORDecryption
from cipher_AES import AESEncryption, AESDecryption
from cipher_B64 import B64Encryption, B64Decryption
from cipher_TDES import TDESEncryption, TDESDecryption

print(sys.argv)

processType = input("Would you like to encrypt or decrypt?\n")
if processType == "encrypt":
    algorithm = input("Would you like to encrypt with XOR, AES, B64, or TDES?\n")
    if algorithm == "XOR":
        fileName = input("Please enter the name of the file (with file extension) that you would like to encrypt with XOR:\n")
        encryptedFileName = input("Please create a file name for the XOR-encrypted file to be written to:\n")
        XOREncryption(fileName, encryptedFileName)
        print("The XOR-encrypted file contents are contained in the file:", encryptedFileName)
    elif algorithm == "AES":
        fileName = input("Please enter the name of the file (with file extension) that you would like to encrypt with AES:\n")
        encryptedFileName = input("Please create a file name for the AES-encrypted file to be written to:\n")
        AESEncryption(fileName, encryptedFileName)
        print("The AES-encrypted file contents are contained in the file:", encryptedFileName)
    elif algorithm == "B64":
        fileName = input("Please enter the name of the file (with file extension) that you would like to encrypt with B64:\n")
        encryptedFileName = input("Please create a file name for the B64-encrypted file to be written to:\n")
        B64Encryption(fileName, encryptedFileName)
        print("The B64-encrypted file contents are contained in the file:", encryptedFileName)
    elif algorithm == "TDES":
        fileName = input("Please enter the name of the file (with file extension) that you would like to encrypt with TDES:\n")
        encryptedFileName = input("Please create a file name for the TDES-encrypted file to be written to:\n")
        key = input("Please enter a key to be used for encryption:\n")
        TDESEncryption(fileName, encryptedFileName, key)
        print("The TDES-encrypted file contents are contained in the file:", encryptedFileName)
    else:
        print("Invalid input")
elif processType == "decrypt":
    algorithm = input("Would you like to decrypt with XOR, AES, B64, or TDES?\n")
    if algorithm == "XOR":
        encryptedFileName = input("Please enter the file name for a XOR-encrypted file:\n")
        decryptedFileName = input("Please create a file name (with appropriate file extension) for the decrypted data to be written to:\n")
        key = input("Please enter your XOR key for decryption:\n")
        XORDecryption(encryptedFileName, decryptedFileName, int(key))
        print("The XOR decrypted file contents are contained in the file:", decryptedFileName)
        os.system(decryptedFileName)
    elif algorithm == "AES":
        encryptedFileName = input("Please enter the file name for an AES-encrypted file:\n")
        decryptedFileName = input("Please create a file name (with appropriate file extension) for the decrypted data to be written to:\n")
        AESDecryption(encryptedFileName, decryptedFileName)
        print("The AES decrypted file contents are contained in the file:", decryptedFileName)
        os.system(decryptedFileName)
    elif algorithm == "B64":
        encryptedFileName = input("Please enter the file name for a B64-encrypted file:\n")
        decryptedFileName = input("Please create a file name (with appropriate file extension) for the decrypted data to be written to:\n")
        B64Decryption(encryptedFileName, decryptedFileName)
        print("The B64 decrypted file contents are contained in the file:", decryptedFileName)
        os.system(decryptedFileName)
    elif algorithm == "TDES":
        encryptedFileName = input("Please enter the file name for a TDES-encrypted file:\n")
        decryptedFileName = input("Please create a file name (with appropriate file extension) for the decrypted data to be written to:\n")
        key = input("Please enter your TDES key for decryption:\n")
        TDESDecryption(encryptedFileName, decryptedFileName, key)
        print("The TDES decrypted file contents are contained in the file:", decryptedFileName)
        os.system(decryptedFileName)
    else:
        print("Invalid input")
else:
    print("Invalid input")