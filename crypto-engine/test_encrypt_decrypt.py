import sys
import os

# Ensure the app module can be imported
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.services.aes_service import aes_service
from app.services.hash_service import hash_service
import traceback

def run_tests():
    print("=== Crypto Services Test Suite ===")
    
    # Setup test data
    test_data = {
        "student_name": "Alice Smith",
        "degree": "B.S. Computer Science",
        "graduation_year": "2026",
        "gpa": 3.9
    }
    
    try:
        # TEST 1: Hash Generation and Verification
        print("\n[Test 1] Hashing and Verification")
        expected_hash = hash_service.generate_sha256(test_data)
        print(f"Generated Hash: {expected_hash}")
        
        is_valid = hash_service.verify_hash(test_data, expected_hash)
        if not is_valid:
            print("❌ Hash verification failed!")
            sys.exit(1)
            
        is_invalid = hash_service.verify_hash({"student_name": "Bob"}, expected_hash)
        if is_invalid:
            print("❌ Hash verification failed (accepted bad data)!")
            sys.exit(1)
            
        print("✅ Hash generation and verification successful.")
        
        # TEST 2: AES Encryption and Decryption Round Trip
        print("\n[Test 2] AES Encryption Round-Trip")
        
        # We need the key bytes
        key_bytes = aes_service.derive_key_from_env()
        
        encrypted_string = aes_service.encrypt_data(test_data, key_bytes)
        print(f"Encrypted String (Length {len(encrypted_string)}): {encrypted_string[:50]}...")
        
        decrypted_data = aes_service.decrypt_data(encrypted_string, key_bytes)
        print(f"Decrypted Data: {decrypted_data}")
        
        if decrypted_data != test_data:
            print("❌ Decrypted data does not match original input!")
            sys.exit(1)
            
        print("✅ AES Round-Trip successful.")
        
        # TEST 3: Graceful Failure on Tampering
        print("\n[Test 3] Tamper Detection")
        
        # Tamper the string: modify the last character
        tampered_string = encrypted_string[:-1] + ('A' if encrypted_string[-1] != 'A' else 'B')
        
        try:
            aes_service.decrypt_data(tampered_string, key_bytes)
            print("❌ Tamper test failed: decryption succeeded on bad data!")
            sys.exit(1)
        except ValueError as e:
            msg = str(e)
            print(f"✅ Tamper cleanly caught! Error Message: '{msg}'")
            if "Decryption failed" not in msg:
                print("❌ Unexpected error message format")
                sys.exit(1)
                
        # TEST 4: Invalid Types
        print("\n[Test 4] Type Validation")
        try:
            aes_service.encrypt_data("string_not_dict", key_bytes)
            print("❌ Type validation failed for encryption!")
            sys.exit(1)
        except TypeError as e:
            print(f"✅ Type validation caught! Error Message: '{str(e)}'")
            
    except Exception as e:
        print(f"\n❌ Unexpected Failure: {str(e)}")
        traceback.print_exc()
        sys.exit(1)
        
    print("\n🎉 All Tests Passed!")

if __name__ == "__main__":
    run_tests()
