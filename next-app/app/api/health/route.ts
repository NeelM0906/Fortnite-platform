import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';

/**
 * GET /api/health
 * Health check endpoint to verify API and database connectivity
 */
export async function GET(req: NextRequest) {
  try {
    // Verify Supabase connection
    const { data, error } = await supabase.rpc('ping');
    
    if (error) {
      console.error('Database connectivity issue:', error);
      
      return NextResponse.json({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        message: 'API is running but database connection issues detected',
        database: 'error',
        services: {
          database: {
            status: 'error',
            message: error.message
          },
          api: {
            status: 'ok',
            message: 'API is responding normally'
          }
        }
      }, { status: 207 });
    }
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'All systems operational',
      services: {
        database: {
          status: 'ok',
          message: 'Database is connected'
        },
        api: {
          status: 'ok',
          message: 'API is responding normally'
        }
      }
    }, { status: 200 });
  } catch (err: any) {
    console.error('Health check error:', err);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      error: err.message || 'Unknown error'
    }, { status: 500 });
  }
} 