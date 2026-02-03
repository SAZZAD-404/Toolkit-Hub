import { NextRequest, NextResponse } from 'next/server';
import { getProviderKeyStatus } from '../../../lib/ai';

export async function GET(request: NextRequest) {
  try {
    const keyStatus = getProviderKeyStatus();
    
    const summary = Object.entries(keyStatus).map(([provider, status]) => ({
      provider,
      totalKeys: status.total,
      failedKeys: status.failed,
      workingKeys: status.total - status.failed,
      healthPercentage: status.total > 0 ? Math.round(((status.total - status.failed) / status.total) * 100) : 0
    }));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      providers: summary,
      totalProviders: summary.length,
      healthyProviders: summary.filter(p => p.workingKeys > 0).length
    });

  } catch (error: any) {
    console.error('Key status check failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check key status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}