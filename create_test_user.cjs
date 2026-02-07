
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    console.log("URL:", supabaseUrl);
    console.log("KEY length:", supabaseKey ? supabaseKey.length : 0);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
    const email = "test@bazzar.com";
    const password = "password123";

    console.log(`Checking user ${email}...`);

    // Check if exists
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error("Error listing users:", listError);
        return;
    }

    const existing = users.users.find(u => u.email === email);

    if (existing) {
        console.log("User already exists:", existing.id);
        // Update password to be sure
        const { error } = await supabase.auth.admin.updateUserById(existing.id, { password: password });
        if (error) console.error("Error updating password:", error);
        else console.log("Password updated.");

        // Check Profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', existing.id).single();
        if (!profile) {
            console.log("Creating missing profile...");
            await supabase.from('profiles').upsert({
                id: existing.id,
                email: email,
                role: 'admin',
                created_at: new Date().toISOString()
            });
        }
        return;
    }

    console.log("Creating user...");
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: "Test User" }
    });

    if (error) {
        console.error("Error creating user:", error);
    } else {
        console.log("User created:", data.user.id);

        // Create profile
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            email: email,
            role: 'admin', // Make admin to see everything
            created_at: new Date().toISOString()
        });
        if (profileError) console.error("Error creating profile:", profileError);
        else console.log("Profile created.");
    }
}

createTestUser();
