// Backend: utils/supabase.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Utilise la clé service_role côté backend
);

const path = require('path');

// Nouvelle fonction utilitaire pour uploader un fichier sur Supabase Storage
async function uploadToSupabaseStorage(file, bucket) {
  const ext = path.extname(file.originalname);
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
  const { data, error } = await supabase.storage.from(bucket).upload(fileName, file.buffer, {
    contentType: file.mimetype,
    upsert: false
  });
  if (error) throw error;
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

module.exports = { supabase, uploadToSupabaseStorage };
