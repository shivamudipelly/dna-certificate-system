import mongoose from 'mongoose';
import dotenv from 'dotenv';
import readline from 'readline';
import Admin from './src/models/Admin.js';

// Load env vars
dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

async function runBootstrap() {
    console.log('🛡️  DNA Certificate System - SuperAdmin Bootstrap Tool');
    console.log('========================================================\n');

    if (!process.env.MONGO_URI) {
        console.error('❌ Error: MONGO_URI is not defined in .env');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to Database.\n');

        const existingAdmin = await Admin.findOne({ role: 'SuperAdmin' });
        if (existingAdmin) {
            console.log(`⚠️  A SuperAdmin already exists (${existingAdmin.email}). Overwriting is disabled for security.`);
            process.exit(0);
        }

        console.log('Creating initial SuperAdmin account...');
        const email = await askQuestion('Admin Email: ');
        const password = await askQuestion('Admin Password: ');
        const department = await askQuestion('Department (e.g. IT, Registrar): ');

        if (!email || !password) {
            console.error('❌ Email and Password are required.');
            process.exit(1);
        }

        const admin = new Admin({
            email: email.toLowerCase().trim(),
            passwordHash: password, // The pre-save hook handles hashing
            role: 'SuperAdmin',
            department: department.trim()
        });

        await admin.save();
        console.log('\n✅ Success! SuperAdmin account created successfully.');
        console.log('You can now log in and use the User Management dashboard to invite others.');

    } catch (err) {
        console.error('\n❌ Bootstrap Failed: ', err.message);
    } finally {
        await mongoose.disconnect();
        rl.close();
        process.exit(0);
    }
}

runBootstrap();
