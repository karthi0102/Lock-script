const fs = require('fs');

// --- Configuration ---
const INPUT_FILE = 'lock-2.json';      // Your raw lock data
const OUTPUT_FILE = 'fault_report-2.json'; // The final summary report
const DROP_THRESHOLD = 5;          // A "significant" drop is 5% or more
const FAULTY_MAX_DROP = 10;          // A lock is faulty if max drop > 10...
const FAULTY_DROP_COUNT = 3;           // ...AND drop count >= 3 on the same day

/**
 * Generates a detailed analysis object for a single day's readings.
 */
function createDailyAnalysis(dayReadings) {
  if (!dayReadings || dayReadings.length < 2) {
    return { max_drop: 0, drop_count: 0 };
  }

  let maxDrop = 0;
  let dropCount = 0;
  let prev = dayReadings[0];

  for (let i = 1; i < dayReadings.length; i++) {
    const curr = dayReadings[i];
    const drop = prev - curr;

    if (drop > maxDrop) {
      maxDrop = drop;
    }
    if (drop >= DROP_THRESHOLD) {
      dropCount++;
    }
    prev = curr;
  }
  return { max_drop: maxDrop, drop_count: dropCount };
}



/**
 * Main function to generate the final fault report.
 */
function generateFaultReport() {
  // --- Step 1: Perform Detailed Analysis ---
  const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  const detailedAnalysis = {};

  console.log(Object.keys(rawData).length)

  for (const hub in rawData) {
    detailedAnalysis[hub] = {};
    for (const lock in rawData[hub]) {
      detailedAnalysis[hub][lock] = {};
      for (const day in rawData[hub][lock]) {
        const dayReadings = rawData[hub][lock][day];
        detailedAnalysis[hub][lock][day] = createDailyAnalysis(dayReadings);
      }
    }
  }

  fs.writeFileSync('output.json',JSON.stringify(detailedAnalysis,null,2))

  // --- Step 2: Create the Final Summary Report ---
  const finalReport = {};



  for (const hub in detailedAnalysis) {
    finalReport[hub] = {};
    const locks = detailedAnalysis[hub]
    for (const lock in locks) {
        
      const days = detailedAnalysis[hub][lock]
      for (const day in days) {
        const dailyReport = days[day];
        if (
          dailyReport.max_drop > FAULTY_MAX_DROP ||
          dailyReport.drop_count >= FAULTY_DROP_COUNT
        ) {
          finalReport[hub][lock] = 'faulty'
          break; 
        }
      }
    }
  }

  return finalReport;
}

// --- Execute the script ---
try {
  console.log('Generating comprehensive fault report...');
  const report = generateFaultReport();
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  console.log(`✅ Success! Fault report saved to '${OUTPUT_FILE}'.`);
} catch (error) {
  console.error('❌ An error occurred:', error.message);
}