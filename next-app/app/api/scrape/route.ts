import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';

/**
 * POST /api/scrape
 * Body: { mapCode: string }
 * Runs the Python scraper for the given map code and returns the result.txt content as JSON.
 */
export async function POST(req: NextRequest) {
  try {
    const { mapCode } = await req.json();
    if (!mapCode || typeof mapCode !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid mapCode' }), { status: 400 });
    }

    // Run the Python scraper as a child process
    const pythonProcess = spawn('python3', ['player-data-scrap.py', mapCode], { cwd: process.cwd() });
    let stderr = '';
    await new Promise((resolve, reject) => {
      pythonProcess.on('error', reject);
      pythonProcess.stderr.on('data', (data) => { stderr += data.toString(); });
      pythonProcess.on('close', (code) => {
        if (code !== 0) reject(new Error(stderr || `Python exited with code ${code}`));
        else resolve(undefined);
      });
    });

    // Read the result.txt file
    const resultPath = process.cwd() + '/result.txt';
    const content = await fs.readFile(resultPath, 'utf-8');
    let json;
    try {
      json = JSON.parse(content);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Failed to parse result.txt as JSON' }), { status: 500 });
    }
    return new Response(JSON.stringify({ data: json }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
