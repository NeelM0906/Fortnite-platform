import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * POST /api/predict
 * Generates predictions based on the scraped data
 */
export async function POST(req: NextRequest) {
  try {
    const { mapCode } = await req.json();
    if (!mapCode || typeof mapCode !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid mapCode' }), { status: 400 });
    }

    // Get the correct project root directory (one level up from next-app)
    const rootDir = path.resolve(process.cwd(), '..');
    
    // Ensure the output directory exists
    const outputDir = path.join(rootDir, 'output');
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (err) {
      // Ignore if directory already exists
    }
    
    // Check if result.txt exists (we need the data to make predictions)
    const resultPath = path.join(rootDir, 'output', 'result.txt');
    try {
      await fs.access(resultPath);
    } catch (err) {
      return new Response(JSON.stringify({ 
        error: 'No data available. Please scrape data first.' 
      }), { status: 400 });
    }

    // Run the prediction script
    const scriptPath = path.join(rootDir, 'src', 'utils', 'prediction_utils.py');
    const outputPath = path.join(rootDir, 'output', 'predictions.json');
    
    // Check if the script exists
    try {
      await fs.access(scriptPath);
    } catch (err) {
      return new Response(JSON.stringify({ 
        error: 'Prediction script not found. Please install the required dependencies.' 
      }), { status: 500 });
    }
    
    // Run the prediction script
    const pythonProcess = spawn('python3', ['-m', 'src.utils.prediction_utils', resultPath, outputPath], { cwd: rootDir });
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

    // Read the predictions
    try {
      const predictionsContent = await fs.readFile(outputPath, 'utf-8');
      const predictions = JSON.parse(predictionsContent);
      
      // Log any warnings from the prediction process
      if (predictions.warning) {
        console.warn(`Prediction warning for map ${mapCode}:`, predictions.warning);
      }
      
      // If it's a simple prediction, make sure the flag is properly passed to the frontend
      if (predictions.is_simple_prediction) {
        console.log(`Using simple predictions for map ${mapCode} due to insufficient data`);
      }
      
      return new Response(JSON.stringify({ predictions }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    } catch (readError: any) {
      return new Response(JSON.stringify({ 
        error: `Failed to read predictions: ${readError.message}` 
      }), { status: 500 });
    }
  } catch (err: any) {
    console.error('API route error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
} 