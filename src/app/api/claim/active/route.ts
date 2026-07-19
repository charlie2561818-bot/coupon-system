import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();

    const liffLocation = await prisma.qrLocation.findUnique({
      where: { id: 'LINE_LIFF' }
    });

    if (liffLocation) {
      if (!liffLocation.activeCampaignId) {
        return NextResponse.json({ success: false, message: '目前沒有綁定活動 (No active campaigns at the moment)' });
      }
      if (liffLocation.activeCampaignId === 'BLINDBOX') {
        return NextResponse.json({ success: false, message: 'LINE 抽獎不支援盲盒模式' });
      }

      const activeCampaign = await prisma.coupon.findUnique({
        where: { id: liffLocation.activeCampaignId }
      });

      if (!activeCampaign || activeCampaign.status !== 'ACTIVE' || now < activeCampaign.validFrom || now > activeCampaign.validUntil) {
        return NextResponse.json({ success: false, message: '綁定的活動已結束或暫停 (Campaign ended or paused)' });
      }

      return NextResponse.json({ 
        success: true, 
        campaignId: activeCampaign.id,
        title: activeCampaign.title 
      });
    }

    const activeCampaign = await prisma.coupon.findFirst({
      where: {
        status: 'ACTIVE',
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!activeCampaign) {
      return NextResponse.json({ success: false, message: '目前沒有進行中的活動 (No active campaigns at the moment)' });
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
