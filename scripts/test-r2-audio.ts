import { r2GetAudioKey, r2FileExists } from "../lib/r2";

async function testAudio() {
  console.log("Testing R2 Audio Files...\n");
  
  const partsToTest = [1, 2, 3, 4, 5];
  
  for (const partNum of partsToTest) {
    console.log(`Part ${partNum}:`);
    const audioKey = await r2GetAudioKey(partNum);
    
    if (audioKey) {
      console.log(`  ✅ Found: ${audioKey}`);
    } else {
      console.log(`  ❌ Not found`);
      
      // Check individual formats
      const mp3 = `audio/Part ${partNum}.mp3`;
      const wav = `audio/Part ${partNum}.wav`;
      const wavDup = `audio/Part ${partNum} (1).wav`;
      
      const mp3Exists = await r2FileExists(mp3);
      const wavExists = await r2FileExists(wav);
      const wavDupExists = await r2FileExists(wavDup);
      
      console.log(`     - ${mp3}: ${mp3Exists ? '✅' : '❌'}`);
      console.log(`     - ${wav}: ${wavExists ? '✅' : '❌'}`);
      console.log(`     - ${wavDup}: ${wavDupExists ? '✅' : '❌'}`);
    }
    console.log();
  }
}

testAudio().catch(console.error);
