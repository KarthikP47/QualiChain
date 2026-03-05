# How to Run Database Migration

## Method 1: Command Line (MySQL CLI) - Recommended

### Windows (PowerShell):
```powershell
mysql -u root -p < sql\migration_add_chat.sql
```

### Linux/Mac:
```bash
mysql -u root -p < sql/migration_add_chat.sql
```

**Steps:**
1. Open terminal/PowerShell
2. Navigate to project root: `cd k:\カルティク\bosm_project`
3. Run the command above
4. Enter your MySQL password when prompted
5. The migration will execute automatically

---

## Method 2: MySQL Command Line (Interactive)

1. Connect to MySQL:
   ```bash
   mysql -u root -p
   ```

2. Select the database:
   ```sql
   USE bosm_project;
   ```

3. Run the migration file:
   ```sql
   source sql/migration_add_chat.sql;
   ```
   
   Or copy-paste the contents of `sql/migration_add_chat.sql` directly

---

## Method 3: MySQL Workbench / phpMyAdmin / Other GUI

1. Open your MySQL GUI tool (Workbench, phpMyAdmin, DBeaver, etc.)
2. Connect to your MySQL server
3. Select the `bosm_project` database
4. Open the file `sql/migration_add_chat.sql`
5. Execute the SQL script (usually a "Run" or "Execute" button)

---

## Method 4: Verify Migration Success

After running the migration, verify the tables were created:

```sql
USE bosm_project;
SHOW TABLES LIKE 'chat%';
```

You should see:
- `chat_rooms`
- `chat_room_members`
- `chat_messages`

Or check table structure:
```sql
DESCRIBE chat_rooms;
DESCRIBE chat_room_members;
DESCRIBE chat_messages;
```

---

## Troubleshooting

### Error: "Access denied"
- Make sure you're using the correct MySQL username and password
- Check your `backend/.env` file for `DB_USER` and `DB_PASS`

### Error: "Unknown database 'bosm_project'"
- First create the database:
  ```sql
  CREATE DATABASE IF NOT EXISTS bosm_project;
  ```
- Or run `sql/schema.sql` first to create the database and all tables

### Error: "Table already exists"
- The migration uses `CREATE TABLE IF NOT EXISTS`, so this is safe
- If you want to recreate tables, drop them first:
  ```sql
  DROP TABLE IF EXISTS chat_messages;
  DROP TABLE IF EXISTS chat_room_members;
  DROP TABLE IF EXISTS chat_rooms;
  ```
  Then run the migration again

---

## What the Migration Creates

The migration creates 3 tables:

1. **chat_rooms** - Stores chat room information
   - Links blockchain room IDs to database records
   - Tracks room name, creator, creation time

2. **chat_room_members** - Tracks which users are in which rooms
   - Links users to rooms
   - Tracks join time and active status

3. **chat_messages** - Stores chat messages
   - Links messages to rooms and users
   - Stores message content and timestamps
