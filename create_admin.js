const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// ============================================
// 👇 請在這裡填寫您的初始管理員帳號密碼 👇
// ============================================
const ADMIN_USERNAME = "admin";          // <-- 在此輸入您的自訂帳號
const ADMIN_PASSWORD = "your_password";  // <-- 在此輸入您的自訂密碼
const ADMIN_NAME = "系統管理員";         // <-- 管理員名稱
// ============================================

async function main() {
  if (ADMIN_USERNAME === "admin" && ADMIN_PASSWORD === "your_password") {
    console.error("❌ 請先用編輯器打開 create_admin.js，將 ADMIN_USERNAME 與 ADMIN_PASSWORD 改成您想要的帳號密碼！");
    process.exit(1);
  }

  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  
  try {
    console.log("正在為您加密密碼...");
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const userId = require('crypto').randomUUID();
    const now = new Date().toISOString();

    console.log("正在將管理員帳號寫入資料庫...");
    
    // Check if user already exists
    const existing = await client.execute({
      sql: 'SELECT id FROM "User" WHERE username = ?',
      args: [ADMIN_USERNAME]
    });

    if (existing.rows.length > 0) {
      // Update password if exists
      await client.execute({
        sql: 'UPDATE "User" SET password = ? WHERE username = ?',
        args: [hashedPassword, ADMIN_USERNAME]
      });
      console.log(`✅ 帳號 '${ADMIN_USERNAME}' 已存在，密碼已成功更新！`);
    } else {
      // Insert new user
      await client.execute({
        sql: 'INSERT INTO "User" (id, username, password, role, name, "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [userId, ADMIN_USERNAME, hashedPassword, 'ADMIN', ADMIN_NAME, now, now]
      });
      console.log(`✅ 成功建立最高權限管理員帳號：${ADMIN_USERNAME}`);
    }

  } catch (err) {
    console.error("❌ 寫入資料庫時發生錯誤：", err);
  } finally {
    client.close();
  }
}

main();
