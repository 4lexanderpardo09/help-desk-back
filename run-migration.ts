import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

const AppDataSource = new DataSource({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: '@Ap200905',
    database: 'helpdeskdb',
    synchronize: false,
    logging: true, // Enable logging to see SQL errors
    entities: [],
});

async function run() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected.');

        const sqlPath = path.join(__dirname, 'src/database/migrations/2026-01-24_refactor_fast_answers_to_error_types.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        const queries = sql.split(';').filter(q => q.trim().length > 0);

        for (const query of queries) {
            console.log(`Executing: ${query}`);
            await AppDataSource.query(query);
        }

        console.log('Migration completed successfully.');
        await AppDataSource.destroy();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

run();
