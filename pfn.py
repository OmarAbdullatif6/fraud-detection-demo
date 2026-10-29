"""
Quick verification script to test TabPFN API connection.
Run with: python pfn.py
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load backend/.env
backend_env = Path(__file__).resolve().parent / "backend" / ".env"
load_dotenv(backend_env)

token = os.getenv("TABPFN_TOKEN", "").strip()
print("=" * 60)
print("TabPFN Cloud API Diagnostic Tool")
print("=" * 60)

if not token:
    print("\n[!] TABPFN_TOKEN is not set.")
    print("1. Get a free API key at: https://platform.priorlabs.ai/account/api-keys")
    print(f"2. Add your key to: {backend_env}")
    print("   Example: TABPFN_TOKEN=your_token_here\n")
    sys.exit(1)

masked = token[:4] + "..." + (token[-4:] if len(token) > 8 else "")
print(f"\n[+] Found TABPFN_TOKEN: {masked}")

try:
    import tabpfn_client
    from tabpfn_client import TabPFNClassifier
    print("[+] tabpfn-client package loaded successfully.")
    
    print("[*] Authenticating with Prior Labs Cloud...")
    tabpfn_client.set_access_token(token)
    tabpfn_client.init()
    print("[+] Authenticated successfully with Prior Labs Cloud!")
    
    # Run a quick sanity check
    print("[*] Running quick test inference...")
    import numpy as np
    X_train = np.array([[1.0, 2.0], [2.0, 1.0], [1.5, 1.8], [3.0, 3.2]])
    y_train = np.array([0, 1, 0, 1])
    X_test = np.array([[1.2, 1.9]])
    
    clf = TabPFNClassifier(random_state=42)
    clf.fit(X_train, y_train)
    probs = clf.predict_proba(X_test)
    print(f"[+] Test prediction successful! Class probabilities: {probs[0]}")
    print("\nTabPFN is ready to be used in the Fraud Detection Demo!")

except Exception as exc:
    print(f"\n[!] Error connecting to TabPFN Cloud API: {exc}")
