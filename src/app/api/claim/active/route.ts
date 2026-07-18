import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const activeCampaign = await prisma.coupon.findFirst({
      where: {
        mode: 'SINGLE_USE',
        status: 'ACTIVE',
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!activeCampaign) {
      return NextResponse.json({ success: false, message: '目前沒有進行中的活動' });
    }

    return NextResponse.json({ 
      success: true, 
      campaignId: activeCampaign.id,
      title: activeCampaign.title 
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: '伺服器錯誤' }, { status: 500 });
  }
}
