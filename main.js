const fs = require('fs');
const csv = require('csv-parser');

const csvFilePath = 'lock-2-sorted.csv';
const jsonFilePath = 'lock-2.json';

const categorizedData = {}

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (row) => {
    const dateKey = row.date.substring(0,10)
    const hubNo = row.serialNo
    const thingName = row.thing_name

    if(!categorizedData[hubNo]){
        categorizedData[hubNo]={}
    }
    if(!categorizedData[hubNo][thingName]){
      categorizedData[hubNo][thingName] = {}
    }
    if (!categorizedData[hubNo][thingName][dateKey]) {
        categorizedData[hubNo][thingName][dateKey] = [];
    }
    const battery = row.battery
    if (battery === "low" || battery === "critical") return
    categorizedData[hubNo][thingName][dateKey].push(parseInt(battery,10));

})
.on('end', () => {
    fs.writeFile(jsonFilePath,JSON.stringify(categorizedData,null,2), (err) => {
      if (err) {
        console.error('❌ Error writing JSON file:', err);
      } else {
        console.log(`✅ Successfully converted '${csvFilePath}' to '${jsonFilePath}'`);
      }
    });
  })
  .on('error', (error) => {
    console.error('❌ Error reading CSV file:', error.message);
  });