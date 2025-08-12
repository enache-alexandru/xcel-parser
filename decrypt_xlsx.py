# decrypt_xlsx.py
import msoffcrypto
import sys

def decrypt_file(encrypted_path, password, output_path):
    with open(encrypted_path, "rb") as enc_file:
        office_file = msoffcrypto.OfficeFile(enc_file)
        office_file.load_key(password=password)
        with open(output_path, "wb") as dec_file:
            office_file.decrypt(dec_file)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python decrypt_xlsx.py <input.xlsx> <password> <output.xlsx>")
        sys.exit(2)
    try:
        decrypt_file(sys.argv[1], sys.argv[2], sys.argv[3])
        print("OK")
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
