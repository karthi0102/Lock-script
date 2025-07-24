const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const {parse,getUnixTime} = require('date-fns');


const inputFile = 'lock-2.csv';
const outputFile = 'lock-2-sorted.csv';

const records = [];


function getUnixTimestamp(dateString){
    const format = 'MM/dd/yyyy hh:mmaa xx';
    const dateObject = parse(dateString,format,new Date());
    return getUnixTime(dateObject)
}

function getBattery(content){
    const inputString = content;
    const jsonString = inputString.replace(/=>/g, ':').replace(/(\w+):/g, '"$1":');
    const parsedObject = JSON.parse(jsonString);
    return parsedObject.status.battery
}

// Step 1: Read and parse CSV
fs.createReadStream(inputFile)
  .pipe(csv())
  .on('data', (row) => {
    const timestamp = getUnixTimestamp(row.created_date_time)
    const batteryValue = getBattery(row.content)
    const newRow = {
        serialNo: parseInt(row.hub_serial_no),
        thingName:row.thing_name,
        date: row.created_date_time,
        battery:batteryValue,
        timestamp:timestamp
    }
    records.push(newRow);
  })
  .on('end', () => {
    // Step 2: Sort by device_id and timestamp
    records.sort((a, b) => {
      if (a.serialNo < b.serialNo) return -1;
      if (a.serialNo > b.serialNo) return 1;
      return a.timestamp - b.timestamp;
    });

    // Convert timestamp back to ISO string
    const sortedData = records.map(r => (
    {
      serialNo: r.serialNo,
      thing_name: r.thingName,
      date: r.date,
      timestamp: r.timestamp,
      battery: r.battery
    }));

    // Step 3: Write to new CSV
    const csvWriter = createObjectCsvWriter({
      path: outputFile,
      header: [
        { id: 'serialNo', title: 'serialNo' },
        { id: 'thing_name', title: 'thing_name'},
        { id: 'date',  title: 'date'},
        { id: 'timestamp', title: 'timestamp' },
        { id: 'battery', title: 'battery' },
      ]
    });

    csvWriter.writeRecords(sortedData)
      .then(() => {
        console.log('Sorted CSV written to:', outputFile);
      });
  });
