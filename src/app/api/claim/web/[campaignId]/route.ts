import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  try {
    const { campaignId } = await params;

    const campaign = await prisma.coupon.findUnique({
      where: { id: campaignId }
    });

    if (!campaign || campaign.status !== 'ACTIVE' || campaign.mode !== 'SINGLE_USE') {
      return NextResponse.json({ success: false, message: '此活動不存在或已結束。 (This campaign does not exist or has ended.)' });
    }

    const now = new Date();
    if (now < campaign.validFrom || now > campaign.validUntil) {
      return NextResponse.json({ success: false, message: '非活動期間，無法參與抽獎。 (This campaign is currently inactive or has expired.)' });
    }

    // 隨機抽獎邏輯
    // 隨機抽獎邏輯
    const WIN_RATE = 0.3; // 30% 中獎率
    const isWinner = Math.random() <= WIN_RATE;

    if (!isWinner) {
      return NextResponse.json({
        success: true,
        won: false,
        campaignId,
        message: '哎呀，差一點點！下次再來試試手氣吧！ (Oops, so close! Better luck next time!)'
      });
    }

    // 中獎了，找出一張未發送且未核銷的序號 (Web版不綁定 claimedBy，純粹標記 isDistributed)
    const availableCode = await prisma.couponCode.findFirst({
      where: {
        couponId: campaignId,
        isDistributed: false,
        redeemedQuantity: 0,
        claimedBy: null
      }
    });

    if (!availableCode) {
      return NextResponse.json({ 
        success: false, 
        campaignId,
        message: '太熱烈了！本次活動的優惠券已經全數發送完畢。 (All coupons for this campaign have been claimed!)' 
      });
    }

    // 把這張序號標記為已發送
    const updatedCode = await prisma.couponCode.update({
      where: { id: availableCode.id },
      data: {
        isDistributed: true
      }
    });

    return NextResponse.json({
      success: true,
      won: true,
      code: updatedCode.code,
      couponTitle: campaign.title,
      couponEnglishTitle: campaign.englishTitle,
      message: `恭喜中獎！這是您的專屬優惠碼！`
    });

  } catch (error) {
    console.error('Web claim API error:', error);
    return NextResponse.json(
      { success: false, message: '伺服器發生異常，請稍後再試。' },
      { status: 500 }
    );
  }
}
