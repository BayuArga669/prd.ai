import mysql from 'mysql2/promise';
import fs from 'fs';
import crypto from 'crypto';

const host = process.env.DB_HOST || '127.0.0.1';

const getSSLConfig = (): mysql.SslOptions | undefined => {
  const isTiDB = host.includes('tidbcloud.com');
  const enableSSL = process.env.DB_SSL === 'true' || isTiDB;

  if (!enableSSL) return undefined;

  const sslOpts: mysql.SslOptions = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };

  if (process.env.DB_SSL_CA) {
    try {
      sslOpts.ca = fs.readFileSync(process.env.DB_SSL_CA, 'utf-8');
    } catch (err) {
      console.error('Failed to read DB_SSL_CA file:', err);
    }
  }

  return sslOpts;
};

const poolConnectionOptions: mysql.PoolOptions = {
  host,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'your_password',
  database: process.env.DB_NAME || 'prd_ai_db',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0', 10),
  connectTimeout: parseInt(process.env.DB_TIMEOUT || '60000', 10),
  ssl: getSSLConfig(),
};

// Singleton pool management for Next.js development hot-reloads
const globalForDb = global as unknown as {
  dbPool: mysql.Pool | undefined;
};

export const pool = globalForDb.dbPool ?? mysql.createPool(poolConnectionOptions);

if (process.env.NODE_ENV !== 'production') {
  globalForDb.dbPool = pool;
}

let isInitialized = false;

export async function initDatabase() {
  if (isInitialized) return;
  
  try {
    // 1. Create users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NULL,
        avatar_url VARCHAR(1024) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // 2. Create documents table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT NULL,
        status VARCHAR(50) DEFAULT 'Draft',
        template_type VARCHAR(100) NULL,
        metadata JSON NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 2b. Migrate existing documents table — add columns if missing
    const alterQueries = [
      "ALTER TABLE documents ADD COLUMN template_type VARCHAR(100) NULL",
      "ALTER TABLE documents ADD COLUMN metadata JSON NULL",
    ];
    for (const q of alterQueries) {
      try {
        await pool.execute(q);
      } catch (err: unknown) {
        // Ignore "Duplicate column" error — column already exists
        // MySQL uses code 'ER_DUP_FIELDNAME', TiDB uses errno 1060
        const mysqlErr = err as { code?: string; errno?: number };
        if (mysqlErr.code !== 'ER_DUP_FIELDNAME' && mysqlErr.errno !== 1060) {
          console.warn('ALTER TABLE notice:', (err as Error).message);
        }
      }
    }
    
    // 3. Seed default user if empty
    const [users] = await pool.execute('SELECT id FROM users LIMIT 1');
    if ((users as unknown[]).length === 0) {
      const email = 'alex@prd.ai';
      const password = 'password123';
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      const passwordHash = `${salt}:${hash}`;
      const name = 'Alex';
      const avatarUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOsrSIo6ERDcTyEsKyPFu3ocrixSsjP2nMQvApIUxrScajbfdEVxSuu7LGJ41jveZ4dFEXl4E8EtoPW3rFJi61n3fcuc6oDyJPl2LL8-UPd9lM1Jj2hb4L-gWOiSxH7WfmqVpNZpjbxqMH3Y5T-WDy7EsAR-wyx8C2P5GrYEI_YdLIvfI0fxxP_fMtNqAjM0ORPt_azHZvFG8GKQD-2nSeoFwa_eRIyM895nEEwpENhc6sY0VhdCjqBVSKl8oslyNP8V53Z3JAtYk';
      
      await pool.execute(
        'INSERT INTO users (email, password, name, avatar_url) VALUES (?, ?, ?, ?)',
        [email, passwordHash, name, avatarUrl]
      );
      console.log('Seeded default user: alex@prd.ai');
    }
    
    isInitialized = true;
    console.log('Database tables verified/created successfully.');
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
  }
}

// Trigger database initialization on pool instantiation
initDatabase().catch((err) => console.error('Database async init failed:', err));

/**
 * Helper function to run database queries
 * @param sql The SQL query string
 * @param params Parameterized query variables
 */
export async function query<T = unknown>(
  sql: string,
  params?: (string | number | boolean | Date | null)[]
): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}
