import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const result = dotenv.config({ path: path.join(__dirname, '.env') });
console.log("Dotenv result:", result.parsed ? "Loaded " + Object.keys(result.parsed).length + " vars" : "Failed to load");
console.log("GEMINI_API_KEY starts with:", process.env.GEMINI_API_KEY?.substring(0, 10));
