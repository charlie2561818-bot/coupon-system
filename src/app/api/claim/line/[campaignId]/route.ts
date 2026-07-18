import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  try {
    const { campaignId } = await params;
    const { userId, displayName } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: '無法取得使用者資訊' }, { status: 400 });
    }

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

    // 檢查此使用者是否已經領過這個活動的優惠券
    const existingCode = await prisma.couponCode.findFirst({
      where: {
        couponId: campaignId,
        claimedBy: userId
      }
    });

    if (existingCode) {
      return NextResponse.json({
        success: true,
        alreadyClaimed: true,
        won: true,
        code: existingCode.code,
        couponTitle: campaign.title,
        couponEnglishTitle: campaign.englishTitle,
        message: '您已經領取過此活動的專屬序號囉！'
      });
    }

    // 隨機抽獎邏輯
    // 隨機抽獎邏輯 (暫時調為 100% 供測試用)
    const WIN_RATE = 1.0; // 100% 中獎率
    const isWinner = Math.random() <= WIN_RATE;

    if (!isWinner) {
      return NextResponse.json({
        success: true,
        won: false,
        alreadyClaimed: false,
        message: '哎呀，差一點點！下次再來試試手氣吧！ (Oops, so close! Better luck next time!)'
      });
    }

    // 找出一張尚未發送且未被領取的序號
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
        message: '太熱烈了！本次活動的優惠券已經全數發送完畢。 (All coupons for this campaign have been claimed!)' 
      });
    }

    // 把這張序號綁定給該名使用者，並標記已發送
    const updatedCode = await prisma.couponCode.update({
      where: { id: availableCode.id },
      data: {
        claimedBy: userId,
        isDistributed: true
      }
    });

    return NextResponse.json({
      success: true,
      won: true,
      alreadyClaimed: false,
      code: updatedCode.code,
      couponTitle: campaign.title,
      couponEnglishTitle: campaign.englishTitle,
      message: `嗨 ${displayName || '好友'}，恭喜中獎！這是您的專屬優惠碼！`
    });

  } catch (error) {
    console.error('Line claim API error:', error);
    return NextResponse.json(
      { success: false, message: '伺服器發生異常，請稍後再試。' },
      { status: 500 }
    );
  }
}
