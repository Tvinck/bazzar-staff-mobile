
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
    const email = "test@bazzar.com";
    const password = "password123";

    // Check if exists
    const { data: users } = await supabase.auth.admin.listUsers();
    const existing = users.users.find(u => u.email === email);

    if (existing) {
        console.log("User already exists:", existing.id);
        // Update password to be sure
        const { error } = await supabase.auth.admin.updateUserById(existing.id, { password: password });
        if (error) console.error("Error updating password:", error);
        else console.log("Password updated.");
        return;
    }

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
