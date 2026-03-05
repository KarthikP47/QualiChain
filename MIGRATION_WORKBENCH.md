# Running Migration in MySQL Workbench

## Step-by-Step Instructions

### Step 1: Open MySQL Workbench
1. Launch MySQL Workbench
2. Connect to your MySQL server (click on your connection)

### Step 2: Open the Migration File
1. In MySQL Workbench, go to **File → Open SQL Script**
2. Navigate to your project folder: `k:\カルティク\bosm_project\sql\`
3. Select `migration_add_chat.sql`
4. Click **Open**

**OR** you can copy-paste the SQL directly:

### Step 3: Select the Database
Before running, make sure you're using the correct database. In the SQL editor, add this at the top (or run it first):

```sql
USE bosm_project;
```

### Step 4: Run the Migration
1. Click the **Execute** button (⚡ lightning bolt icon) in the toolbar
   - Or press `Ctrl+Shift+Enter` (Windows) / `Cmd+Shift+Enter` (Mac)
   - Or go to **Query → Execute (All or Selection)**

2. The migration will run and create the 3 tables

### Step 5: Verify Success
Run this query to check if tables were created:

```sql
SHOW TABLES LIKE 'chat%';
```

You should see:
- `chat_rooms`
- `chat_room_members`
- `chat_messages`

---

## Alternative: Copy-Paste Method

If you prefer to copy-paste, here's the full migration SQL:

```sql
-- Migration: Add chat tables
USE bosm_project;

CREATE TABLE IF NOT EXISTS chat_rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id_uint256 BIGINT NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  creator_wallet VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_room_id (room_id_uint256)
);

CREATE TABLE IF NOT EXISTS chat_room_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id_uint256 BIGINT NOT NULL,
  user_id INT NOT NULL,
  wallet_address VARCHAR(100) NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_room_member (room_id_uint256, user_id),
  INDEX idx_room_id (room_id_uint256),
  INDEX idx_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id_uint256 BIGINT NOT NULL,
  user_id INT NOT NULL,
  wallet_address VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_room_id (room_id_uint256),
  INDEX idx_created_at (created_at)
);
```

**Steps:**
1. Open a new SQL tab in MySQL Workbench
2. Paste the SQL above
3. Click **Execute** (⚡ button)
4. Done!

---

## Visual Guide

1. **SQL Editor Tab** - This is where you write/run SQL
2. **Execute Button** - The lightning bolt ⚡ icon executes your SQL
3. **Result Grid** - Shows the results after execution
4. **Output Panel** - Shows messages and errors

---

## Troubleshooting

### Error: "Unknown database 'bosm_project'"
- First create the database:
  ```sql
  CREATE DATABASE IF NOT EXISTS bosm_project;
  ```
- Or run `sql/schema.sql` first to set up the entire database

### Error: "Table already exists"
- This is safe! The migration uses `CREATE TABLE IF NOT EXISTS`
- Tables won't be recreated if they already exist
- You can ignore this message

### Error: "Access denied"
- Make sure you're connected with a user that has CREATE privileges
- Usually `root` user works fine

---

## Quick Verification Query

After running the migration, execute this to see all chat tables:

```sql
USE bosm_project;

-- Show all chat tables
SHOW TABLES LIKE 'chat%';

-- Check table structure
DESCRIBE chat_rooms;
DESCRIBE chat_room_members;
DESCRIBE chat_messages;
```

If you see all 3 tables, the migration was successful! ✅
