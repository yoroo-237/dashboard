import { supabase } from './supabaseClient';

// src/services/supabaseClient.js déjà présent
// On réutilise le même client pour les produits et reviews

// Fonction utilitaire pour uploader une image sur Supabase Storage (bucket configurable)
export async function uploadImageToSupabase(file, bucket = 'product-images') {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false
  });
  if (error) throw error;
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}
