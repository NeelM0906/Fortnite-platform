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

    // STEP 1: Run the Python Flask service API to get chart data
    const flaskServiceUrl = 'http://localhost:5003/player_stats/' + mapCode;
    console.log(`Making request to Flask API at: ${flaskServiceUrl}`);
    
    try {
      const response = await fetch(flaskServiceUrl);
      
      if (!response.ok) {
        throw new Error(`Flask API returned status ${response.status}`);
      }
      
      const chartData = await response.json();
      
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
          if (chartData && chartData.player_stats) {
            chartData.code = mapInfoData.code;
            chartData.description = mapInfoData.description;
            chartData.creator = mapInfoData.creator;
            chartData.creator_code = mapInfoData.creatorCode;
            chartData.published_date = mapInfoData.publishedDate;
            chartData.tags = mapInfoData.tags;
            chartData.version = mapInfoData.version;
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
    } catch (flaskError: any) {
      console.error('Flask API error:', flaskError);
      return new Response(JSON.stringify({ 
        error: `Failed to get data from Flask service: ${flaskError.message}` 
      }), { status: 500 });
    }
  } catch (err: any) {
    console.error('API route error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
