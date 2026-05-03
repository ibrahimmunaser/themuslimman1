import { r2ListFiles, r2ListFolders } from "../lib/r2";

async function checkR2Structure() {
  console.log("Checking R2 Bucket Structure...\n");
  
  // List all top-level folders
  console.log("📁 Top-level folders:");
  const folders = await r2ListFolders();
  folders.forEach(f => console.log(`  - ${f}`));
  
  console.log("\n📄 Audio files:");
  const audioFiles = await r2ListFiles("audio/", 20);
  
  if (audioFiles.length === 0) {
    console.log("  ❌ No files found in audio/ folder");
    
    // Check for alternate naming
    console.log("\n  Checking alternate folder names...");
    const altAudio = await r2ListFiles("Audio/", 10);
    const altAudios = await r2ListFiles("audios/", 10);
    
    if (altAudio.length > 0) {
      console.log("  ⚠️  Found files in 'Audio/' (capital A):");
      altAudio.slice(0, 5).forEach(f => console.log(`    - ${f.key}`));
    }
    if (altAudios.length > 0) {
      console.log("  ⚠️  Found files in 'audios/' (plural):");
      altAudios.slice(0, 5).forEach(f => console.log(`    - ${f.key}`));
    }
  } else {
    console.log(`  ✅ Found ${audioFiles.length} files:`);
    audioFiles.slice(0, 10).forEach(f => {
      console.log(`    - ${f.key} (${(f.size / 1024 / 1024).toFixed(2)} MB)`);
    });
  }
}

checkR2Structure().catch(console.error);
