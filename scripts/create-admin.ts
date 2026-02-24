import pg from "pg";
import bcrypt from "bcryptjs";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:admin26@localhost:5432/tawa_services";

async function createAdmin() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  const passwordHash = await bcrypt.hash("Admin123!", 12);

  const result = await pool.query(
    `INSERT INTO users (id, email, "passwordHash", phone, role, "emailVerified", "phoneVerified", name, "isActive", "isBanned", "failedLoginAttempts", "twoFactorEnabled", "isDeleted", "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
     ON CONFLICT (email) DO NOTHING
     RETURNING id, email, role, name`,
    [
      "admin@tawa.tn",
      passwordHash,
      "+21600000000",
      "ADMIN",
      true,
      true,
      "Admin Tawa",
      true,
      false,
      0,
      false,
      false,
    ]
  );

  if (result.rows.length > 0) {
    console.log("Admin created:", result.rows[0]);
  } else {
    console.log("Admin already exists (email: admin@tawa.tn)");
  }

  await pool.end();
}

createAdmin().catch((e) => {
  console.error(e);
  process.exit(1);
});
