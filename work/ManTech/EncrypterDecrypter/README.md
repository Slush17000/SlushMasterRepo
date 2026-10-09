# File Encryptor and Decryptor

A small Tkinter desktop application for encrypting or decrypting files with the project's AES, Base64, TDES, and XOR implementations. The GUI works with binary files and leaves the original input file unchanged.

## Prerequisites

- Python 3.10 or newer
- Tkinter (included with the standard Windows Python installer)
- PyCryptodome, installed from `requirements.txt`

## Setup and Launch

From the repository root in PowerShell:

```powershell
Set-Location "work\ManTech\EncrypterDecrypter"
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe file_crypto_gui.py
```

The GUI can also be launched with `py file_crypto_gui.py` after installing PyCryptodome in the Python environment used by `py`.

If this folder was renamed after creating `.venv`, recreate the virtual environment before using its activation scripts; those scripts contain the original absolute folder path. The interpreter at `.venv\Scripts\python.exe` currently runs from the renamed location, but recreating the environment avoids stale activation paths.

## Using the GUI

1. Choose **Encrypt** or **Decrypt**.
2. Choose AES, B64, TDES, or XOR.
3. Browse to the input file. The output field is filled with a suggested name in `ExampleFiles`; change the filename or use **Save as...** to choose another name in that folder.
4. Enter a key when the selected method requires one, then start the operation.
5. Confirm if the output already exists. On success, use **Open output** to open it with the operating system's associated application.

New encrypted and decrypted files are always written to the `ExampleFiles` folder beside the GUI script, regardless of where the input file is located. The operation runs in the background so the window remains responsive. Results are first written to a temporary file; the destination is replaced only after the operation succeeds.

### Key Handling

- **AES:** No key is requested. The implementation uses a fixed key embedded in `cipher_AES.py`.
- **B64:** No key is used. Base64 encodes bytes; it is not encryption and provides no confidentiality.
- **TDES:** Enter the same ASCII passphrase for encryption and decryption.
- **XOR:** Encryption generates a random one-byte key. The GUI displays it after encryption and provides a copy button. Save that value; decryption requires the integer from 0 through 255.

## Security Limitations

These are educational implementations, not suitable for protecting sensitive data. AES uses a hardcoded key, TDES is a legacy cipher and the current implementation does not authenticate ciphertext, XOR has only a one-byte key, and Base64 is only an encoding. Wrong keys for unauthenticated formats may produce output without an error. Use a maintained, authenticated encryption format for real security needs.

## Project Layout

| File | Purpose |
| --- | --- |
| `file_crypto_gui.py` | Tkinter interface, input validation, background work, and output handling |
| `ExampleFiles/` | Sample inputs and all new encrypted/decrypted outputs |
| `cipher_AES.py` | AES-EAX file encryption and authenticated decryption |
| `cipher_B64.py` | Base64 file encoding and decoding |
| `cipher_TDES.py` | Existing TDES file methods and passphrase handling |
| `cipher_XOR.py` | XOR file methods and generated decryption key |
| `encDecDriver.py` | Original interactive command-line driver |
| `requirements.txt` | PyCryptodome dependency |
| `plainText1.txt`, `plainText2.txt`, `image1.png`, `image2.jpg` | Sample input files |