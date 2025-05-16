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
      
      // Check if the file has valid content
      const content = await fs.readFile(resultPath, 'utf-8');
      if (!content || content.trim() === '' || content.trim() === '[]') {
        console.warn(`Empty result.txt file for map code ${mapCode}`);
        return new Response(JSON.stringify({ 
          error: 'No data available. Please scrape data first.' 
        }), { status: 400 });
      }

      // Verify it contains valid JSON
      try {
        JSON.parse(content);
      } catch (e) {
        console.error(`Invalid JSON in result.txt for map code ${mapCode}:`, e);
        return new Response(JSON.stringify({ 
          error: 'Invalid data format. Please scrape data again.' 
        }), { status: 400 });
      }
      
    } catch (err) {
      console.error(`result.txt not found for map code ${mapCode}:`, err);
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
      console.error(`Prediction script not found: ${scriptPath}`, err);
      return new Response(JSON.stringify({ 
        error: 'Prediction script not found. Please install the required dependencies.' 
      }), { status: 500 });
    }
    
    // Run the prediction script
    console.log(`Running prediction script for map code ${mapCode} with input ${resultPath} and output ${outputPath}`);
    const pythonProcess = spawn('python3', ['-m', 'src.utils.prediction_utils', resultPath, outputPath], { 
      cwd: rootDir,
      env: { ...process.env, PYTHONUNBUFFERED: '1' }  // Use unbuffered output for better logging
    });
    
    let stderr = '';
    let stdout = '';
    
    pythonProcess.stdout.on('data', (data) => { 
      const output = data.toString();
      stdout += output;
      console.log(`Prediction script stdout: ${output}`);
    });
    
    pythonProcess.stderr.on('data', (data) => { 
      const output = data.toString();
      stderr += output;
      console.error(`Prediction script stderr: ${output}`);
    });
    
    try {
      await new Promise((resolve, reject) => {
        pythonProcess.on('error', (err) => {
          console.error('Failed to start Python process:', err);
          reject(err);
        });
        
        pythonProcess.on('close', (code) => {
          console.log(`Python process exited with code ${code}`);
          if (code !== 0) {
            console.error('Python stderr:', stderr);
            reject(new Error(stderr || `Python exited with code ${code}`));
          } else {
            resolve(undefined);
          }
        });
        
        // Set a timeout in case the process hangs
        setTimeout(() => {
          pythonProcess.kill();
          reject(new Error('Prediction script timeout after 30 seconds'));
        }, 30000);
      });
    } catch (error: any) {
      console.error(`Error running prediction script for map ${mapCode}:`, error);
      return new Response(JSON.stringify({ 
        error: `Failed to generate predictions: ${error.message}` 
      }), { status: 500 });
    }

    // Read the predictions
    try {
      // Check if the output file exists
      await fs.access(outputPath);
      
      const predictionsContent = await fs.readFile(outputPath, 'utf-8');
      if (!predictionsContent || predictionsContent.trim() === '') {
        throw new Error('Empty predictions output file');
      }
      
      const predictions = JSON.parse(predictionsContent);
      
      // Basic validation of the predictions object
      if (!predictions || typeof predictions !== 'object') {
        throw new Error('Invalid predictions format');
      }
      
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
      console.error(`Failed to read predictions for map ${mapCode}:`, readError);
      
      // Provide a fallback prediction if the file couldn't be read
      const fallbackPredictions = {
        best_player_count: 100,
        explanations: [
          "Error reading prediction results.",
          "Using default player count recommendation."
        ],
        confidence_score: 0.4,
        is_simple_prediction: true,
        is_hourly: true,
        warning: `Failed to read predictions: ${readError.message}`,
        predictions: [
          {
            time: '1 PM',
            value: 100,
            lower: 90,
            upper: 110,
            is_prediction: true,
            is_simple_prediction: true
          }
        ]
      };
      
      return new Response(JSON.stringify({ 
        predictions: fallbackPredictions,
        error: `Failed to read predictions: ${readError.message}` 
      }), { status: 200 });  // Return 200 with fallback data instead of 500
    }
  } catch (err: any) {
    console.error('API route error:', err);
    
    // Fallback predictions in case of API error
    const fallbackPredictions = {
      best_player_count: 100,
      explanations: [
        "An error occurred while generating predictions.",
        "Using default player count recommendation."
      ],
      confidence_score: 0.4,
      is_simple_prediction: true,
      is_hourly: true,
      warning: `API error: ${err.message}`,
      predictions: [
        {
          time: '1 PM',
          value: 100,
          lower: 90,
          upper: 110,
          is_prediction: true,
          is_simple_prediction: true
        }
      ]
    };
    
    return new Response(JSON.stringify({ 
      predictions: fallbackPredictions,
      error: err.message 
    }), { status: 200 });  // Return 200 with fallback data instead of 500
  }
} 