// node convert.js boycott.csv

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const filename = process.argv[2];
if (!filename) {
  console.error('Please provide a CSV filename');
  console.error('Usage: node convert.js boycott.csv');
  process.exit(1);
}

const outputPath = process.argv[3] || './public/boycott.json';

console.log(`Reading CSV file: ${filename}`);
const csvData = fs.readFileSync(filename, 'utf8');

function parseCSV(csv) {
  const lines = csv.replace(/\r\n/g, '\n').split('\n');
  
  let headers = [];
  let currentHeader = '';
  let inQuotes = false;
  
  for (let i = 0; i < lines[0].length; i++) {
    const char = lines[0][i];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      headers.push(currentHeader.trim());
      currentHeader = '';
    } else {
      currentHeader += char;
    }
  }
  
  headers.push(currentHeader.trim());
  
  console.log('Parsed headers:', headers);
  
  const companyIdx = headers.findIndex(h => h === 'Company');
  const deiIdx = headers.findIndex(h => h.includes('DEI'));
  const elSalvadorIdx = headers.findIndex(h => h.includes('El Salvador'));
  const trumpCampaignIdx = headers.findIndex(h => h.includes('Trump Campaign'));
  const trumpInaugIdx = headers.findIndex(h => h.includes('Trump Inauguration'));
  const bidenInaugIdx = headers.findIndex(h => h.includes('Biden Inauguration'));
  const notesIdx = headers.findIndex(h => h === 'Notes');
  
  console.log('Column indices:');
  console.log(`Company: ${companyIdx}, DEI: ${deiIdx}, El Salvador: ${elSalvadorIdx}`);
  console.log(`Trump Campaign: ${trumpCampaignIdx}, Trump Inauguration: ${trumpInaugIdx}`);
  console.log(`Biden Inauguration: ${bidenInaugIdx}, Notes: ${notesIdx}`);
  
  if (companyIdx === -1 || deiIdx === -1 || elSalvadorIdx === -1 || trumpCampaignIdx === -1 || 
      trumpInaugIdx === -1 || bidenInaugIdx === -1 || notesIdx === -1) {
    console.error('ERROR: Missing one or more required columns!');
    console.error('Missing columns:');
    if (companyIdx === -1) console.error('- Company');
    if (deiIdx === -1) console.error('- DEI');
    if (elSalvadorIdx === -1) console.error('- El Salvador');
    if (trumpCampaignIdx === -1) console.error('- Trump Campaign');
    if (trumpInaugIdx === -1) console.error('- Trump Inauguration');
    if (bidenInaugIdx === -1) console.error('- Biden Inauguration');
    if (notesIdx === -1) console.error('- Notes');
  }
  
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; 
    
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    values.push(currentValue.trim());
    
    const companyName = values[companyIdx];
    if (companyName && companyName.trim()) {
      const company = {
        company: companyName.trim(),
        modified_dei_programs: ['TRUE', 'true', 'Yes', 'yes', '1'].includes(values[deiIdx]),
        made_in_el_salvador: ['TRUE', 'true', 'Yes', 'yes', '1'].includes(values[elSalvadorIdx]),
        donated_trump_campaign: ['TRUE', 'true', 'Yes', 'yes', '1'].includes(values[trumpCampaignIdx]),
        donated_trump_inauguration: ['TRUE', 'true', 'Yes', 'yes', '1'].includes(values[trumpInaugIdx]),
        donated_biden_inauguration: ['TRUE', 'true', 'Yes', 'yes', '1'].includes(values[bidenInaugIdx]),
        notes: values[notesIdx] ? values[notesIdx].trim() : ''
      };
      
      result.push(company);
    }
  }
  
  return result;
}

let companies = parseCSV(csvData);

companies = companies.sort((a, b) => {
  const companyA = a.company.toLowerCase();
  const companyB = b.company.toLowerCase();
  
  if (companyA < companyB) return -1;
  if (companyA > companyB) return 1;
  return 0;
});

function writeJsonFile(data, outputPath) {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    
    fs.writeFileSync(outputPath, jsonString);
    console.log(`Successfully processed ${data.length} companies`);
    console.log(`JSON data written to: ${outputPath}`);
    
    const csvSize = fs.statSync(filename).size;
    const jsonSize = fs.statSync(outputPath).size;
    console.log(`CSV size: ${(csvSize / 1024).toFixed(2)} KB`);
    console.log(`JSON size: ${(jsonSize / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error(`Error writing JSON file: ${error.message}`);
    process.exit(1);
  }
}

writeJsonFile(companies, outputPath);