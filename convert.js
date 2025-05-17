// This script properly converts a CSV file to JSON, correctly handling the Notes field
// Usage: node convert.js boycott.csv

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// Get the CSV filename from command line arguments
const filename = process.argv[2];
if (!filename) {
  console.error('Please provide a CSV filename');
  console.error('Usage: node convert.js boycott.csv');
  process.exit(1);
}

// Get the output path - either specified or default to current directory
const outputPath = process.argv[3] || './public/boycott.json';

// Read the CSV file
console.log(`Reading CSV file: ${filename}`);
const csvData = fs.readFileSync(filename, 'utf8');

// More robust CSV parser function
function parseCSV(csv) {
  // Split into lines and handle different line endings
  const lines = csv.replace(/\r\n/g, '\n').split('\n');
  
  // First, correctly parse the headers
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
  
  // Don't forget the last header
  headers.push(currentHeader.trim());
  
  // For debugging
  console.log('Parsed headers:', headers);
  
  // Find our needed column indices
  const companyIdx = headers.findIndex(h => h === 'Company');
  const deiIdx = headers.findIndex(h => h.includes('DEI'));
  const elSalvadorIdx = headers.findIndex(h => h.includes('El Salvador'));
  const trumpCampaignIdx = headers.findIndex(h => h.includes('Trump Campaign'));
  const trumpInaugIdx = headers.findIndex(h => h.includes('Trump Inauguration'));
  const bidenInaugIdx = headers.findIndex(h => h.includes('Biden Inauguration'));
  const notesIdx = headers.findIndex(h => h === 'Notes');
  
  // For debugging
  console.log('Column indices:');
  console.log(`Company: ${companyIdx}, DEI: ${deiIdx}, El Salvador: ${elSalvadorIdx}`);
  console.log(`Trump Campaign: ${trumpCampaignIdx}, Trump Inauguration: ${trumpInaugIdx}`);
  console.log(`Biden Inauguration: ${bidenInaugIdx}, Notes: ${notesIdx}`);
  
  // Check if we found all needed columns
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
  
  // Process the data rows
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    
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
    
    // Don't forget the last value
    values.push(currentValue.trim());
    
    // Only process rows with a company name
    const companyName = values[companyIdx];
    if (companyName && companyName.trim()) {
      // Create our JSON object with the correct field mapping
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

// Parse the CSV
let companies = parseCSV(csvData);

// Sort companies alphabetically by company name
companies = companies.sort((a, b) => {
  // Case-insensitive sorting
  const companyA = a.company.toLowerCase();
  const companyB = b.company.toLowerCase();
  
  if (companyA < companyB) return -1;
  if (companyA > companyB) return 1;
  return 0;
});

// Write the JSON file
function writeJsonFile(data, outputPath) {
  try {
    // Create formatted JSON
    const jsonString = JSON.stringify(data, null, 2);
    
    // Write to the file
    fs.writeFileSync(outputPath, jsonString);
    console.log(`Successfully processed ${data.length} companies`);
    console.log(`JSON data written to: ${outputPath}`);
    
    // Calculate file sizes for information
    const csvSize = fs.statSync(filename).size;
    const jsonSize = fs.statSync(outputPath).size;
    console.log(`CSV size: ${(csvSize / 1024).toFixed(2)} KB`);
    console.log(`JSON size: ${(jsonSize / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error(`Error writing JSON file: ${error.message}`);
    process.exit(1);
  }
}

// Write the output to file
writeJsonFile(companies, outputPath);