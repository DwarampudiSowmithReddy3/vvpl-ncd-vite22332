import mysql.connector
import hashlib

# Connect to database
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='sowmith',
    database='ncd_management'
)

cursor = conn.cursor()

# Get admin user password hash
cursor.execute("SELECT username, password_hash FROM users WHERE username = 'admin'")
result = cursor.fetchone()

if result:
    username, stored_hash = result
    print(f"Admin user: {username}")
    print(f"Stored hash: {stored_hash}")
    
    # Test password hashing
    test_password = "admin123"
    calculated_hash = hashlib.sha256(test_password.encode()).hexdigest()
    print(f"Calculated hash for 'admin123': {calculated_hash}")
    
    # Check if they match
    if stored_hash == calculated_hash:
        print("✅ Password hashes MATCH - authentication should work")
    else:
        print("❌ Password hashes DO NOT MATCH - this is the problem!")
        print("Need to update the password hash in database")
else:
    print("❌ Admin user not found in database")

conn.close()