#!/usr/bin/env python3
"""Run from project root to drop NCD MySQL databases. Run once before recreating backend."""
import os
try:
    import mysql.connector
except ImportError:
    print("Run: pip install mysql-connector-python")
    exit(1)

# Use backend/.env if present, else defaults
from pathlib import Path
env_path = Path(__file__).parent / "backend" / ".env"
if env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(env_path)

HOST = os.getenv("MYSQL_HOST", "localhost")
USER = os.getenv("MYSQL_USER", "root")
PASSWORD = os.getenv("MYSQL_PASSWORD", "sowmith")
PORT = int(os.getenv("MYSQL_PORT", "3306"))

def main():
    try:
        conn = mysql.connector.connect(host=HOST, port=PORT, user=USER, password=PASSWORD)
        cur = conn.cursor()
        for db in ["ncdmanagement", "NCDManagement", "ncd_management"]:
            cur.execute(f"DROP DATABASE IF EXISTS `{db}`")
            print(f"  Dropped database (if existed): {db}")
        conn.commit()
        conn.close()
        print("Done. You can now recreate the backend.")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
