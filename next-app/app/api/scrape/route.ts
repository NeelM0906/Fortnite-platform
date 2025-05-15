import { NextRequest } from 'next/server';
import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * POST /api/scrape
 * Body: { mapCode: string }
 * Runs both Python and JS scripts and merges the results.
 */
export async function POST(req: NextRequest) {
  try {
    const { mapCode } = await req.json();
    if (!mapCode || typeof mapCode !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid mapCode' }), { status: 400 });
    }

    // Get the correct project root directory (one level up from next-app)
    const rootDir = path.resolve(process.cwd(), '..');
    console.log(`Project root directory: ${rootDir}`);

    // Ensure the output directory exists
    const outputDir = path.join(rootDir, 'output');
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (err) {
      // Ignore if directory already exists
    }

    // STEP 1: Run the Python scraper
    const scriptPath = path.join(rootDir, 'src', 'scrapers', 'island_scraper.py');
    console.log(`Running Python script at: ${scriptPath}`);
    
    // Check if the script exists
    try {
      await fs.access(scriptPath);
    } catch (err) {
      console.error(`Script not found at ${scriptPath}`);
      return new Response(JSON.stringify({ error: `Python script not found at ${scriptPath}` }), { status: 500 });
    }
    
    const outputPath = path.join(rootDir, 'output', 'result.txt');
    const pythonProcess = spawn('python3', ['-m', 'src.scrapers.island_scraper', mapCode], { cwd: rootDir });
    let stderr = '';
    let stdout = '';
    
    await new Promise((resolve, reject) => {
      pythonProcess.on('error', (err) => {
        console.error('Failed to start Python process:', err);
        reject(err);
      });
      
      pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
      pythonProcess.stderr.on('data', (data) => { stderr += data.toString(); });
      
      pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        if (code !== 0) {
          console.error('Python stderr:', stderr);
          reject(new Error(stderr || `Python exited with code ${code}`));
        } else {
          resolve(undefined);
        }
      });
    });

    // Read the chart data
    console.log(`Reading chart data from: ${outputPath}`);
    
    try {
      const chartDataContent = await fs.readFile(outputPath, 'utf-8');
      let chartData = JSON.parse(chartDataContent);

      // STEP 2: Run the JS script
      const jsScriptPath = path.join(rootDir, 'src', 'api', 'fortnite_api.js');
      console.log(`Running JS script at: ${jsScriptPath}`);
      
      // Check if the script exists
      try {
        await fs.access(jsScriptPath);
      } catch (err) {
        return new Response(JSON.stringify({ 
          error: `JS script not found at ${jsScriptPath}`,
          data: chartData // Return what we have so far
        }), { status: 206 });
      }
      
      try {
        const mapInfoRaw = await new Promise<string>((resolve, reject) => {
          exec(`node ${jsScriptPath} ${mapCode}`, { cwd: rootDir }, (error, stdout, stderr) => {
            if (error) {
              console.error('JS script error:', error);
              console.error('JS stderr:', stderr);
              reject(error);
            } else {
              resolve(stdout);
            }
          });
        });
        
        try {
          // Try to parse the output as JSON
          // Clean the output first to handle any extra text
          const cleanedOutput = mapInfoRaw.trim().match(/\{[\s\S]*\}/);
          if (!cleanedOutput) {
            throw new Error('Could not find valid JSON in the output');
          }
          
          const mapInfoData = JSON.parse(cleanedOutput[0]);
          
          // Merge the data
          if (Array.isArray(chartData) && chartData.length > 0) {
            chartData[0] = {
              ...chartData[0],
              code: mapInfoData.code,
              description: mapInfoData.description,
              creator: mapInfoData.creator,
              creator_code: mapInfoData.creatorCode,
              published_date: mapInfoData.publishedDate,
              tags: mapInfoData.tags,
              version: mapInfoData.version
            };
          }
        } catch (e) {
          console.error('Failed to parse JS output:', e);
          console.log('JS raw output:', mapInfoRaw);
        }
      } catch (jsError) {
        console.error('JS execution error:', jsError);
        // Continue with just the chart data
      }

      return new Response(JSON.stringify({ data: chartData }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    } catch (readError: any) {
      return new Response(JSON.stringify({ 
        error: `Failed to read chart data: ${readError.message}` 
      }), { status: 500 });
    }
  } catch (err: any) {
    console.error('API route error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
