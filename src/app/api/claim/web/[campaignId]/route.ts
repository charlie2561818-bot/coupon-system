import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  try {
    const { campaignId } = await params;
    const campaign = await prisma.coupon.findUnique({
      where: { id: campaignId },
      select: { title: true, isDraw: true, status: true }
    });

    if (!campaign || campaign.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, message: '此活動不存在或已結束。' });
    }

    return NextResponse.json({ success: true, title: campaign.title, isDraw: campaign.isDraw });
  } catch (error) {
    return NextResponse.json({ success: false, message: '伺服器錯誤' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  try {
    const { campaignId } = await params;

    const campaign = await prisma.coupon.findUnique({
      where: { id: campaignId }
    });

    if (!campaign || campaign.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, message: '此活動不存在或已結束。 (This campaign does not exist or has ended.)' });
    }

    const now = new Date();
    if (now < campaign.validFrom || now > campaign.validUntil) {
      return NextResponse.json({ success: false, message: '非活動期間，無法參與抽獎。 (This campaign is currently inactive or has expired.)' });
    }

    // 抽獎或直接領取邏輯
    const WIN_RATE = campaign.isDraw ? 0.3 : 1.0; // 若非抽獎模式，中獎率 100%
    const isWinner = Math.random() <= WIN_RATE;

    if (!isWinner) {
      return NextResponse.json({
        success: true,
        won: false,
        campaignId,
        isDraw: campaign.isDraw,
        message: '哎呀，差一點點！下次再來試試手氣吧！ (Oops, so close! Better luck next time!)'
      });
    }

    let availableCode: any = null;

    if (campaign.mode === 'SINGLE_USE') {
      // 中獎了，找出一張未發送且未核銷的序號 (Web版不綁定 claimedBy，純粹標記 isDistributed)
      availableCode = await prisma.couponCode.findFirst({
        where: {
          couponId: campaignId,
          isDistributed: false,
          redeemedQuantity: 0,
          claimedBy: null
        }
      });

      if (availableCode) {
        // 把這張序號標記為已發送
        await prisma.couponCode.update({
          where: { id: availableCode.id },
          data: { isDistributed: true }
        });
      }
    } else {
      // MULTI_USE
      availableCode = await prisma.couponCode.findFirst({
        where: { couponId: campaignId }
      });
      if (availableCode && availableCode.redeemedQuantity >= availableCode.maxUsage) {
        availableCode = null;
      }
    }

    if (!availableCode) {
      return NextResponse.json({ 
        success: false, 
        campaignId,
        message: '太熱烈了！本次活動的優惠券已經全數發送完畢。 (All coupons for this campaign have been claimed!)' 
      });
    }

    return NextResponse.json({
      success: true,
      won: true,
      campaignId,
      code: availableCode.code,
      couponTitle: campaign.title,
      couponEnglishTitle: campaign.englishTitle,
      isDraw: campaign.isDraw,
      message: campaign.usageRules || (campaign.isDraw 
        ? '恭喜中獎！請向櫃檯人員出示此畫面。 (Congratulations! Please present this screen to our staff.)' 
        : '領取成功！請向櫃檯人員出示此畫面。 (Successfully claimed! Please present this screen to our staff.)')
    });

  } catch (error) {
    console.error('Web claim API error:', error);
    return NextResponse.json(
      { success: false, message: '伺服器發生異常，請稍後再試。' },
      { status: 500 }
    );
  }
}
