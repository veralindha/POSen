
import mysql from 'mysql2/promise';

export async function executeQuery({ query, values = [] }) {
  const dbConnection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
  });
  
  try {
    const [results] = await dbConnection.execute(query, values);
    return results;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error(error.message);
  } finally {
    await dbConnection.end();
  }
}
