import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    const { userId, displayName } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: '無法取得使用者資訊' }, { status: 400 });
    }

    const now = new Date();

    // 1. 尋找目前正在進行中，且是「A模式(SINGLE_USE)」的活動
    // (如果同時有多個活動，預設抓取最新建立的一個)
    const activeCampaign = await prisma.coupon.findFirst({
      where: {
        mode: 'SINGLE_USE',
        status: 'ACTIVE',
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!activeCampaign) {
      return NextResponse.json({ 
        success: false, 
        message: '目前沒有進行中的專屬優惠活動喔！' 
      });
    }

    // 2. 檢查此使用者是否已經領過這個活動的優惠券
    const existingCode = await prisma.couponCode.findFirst({
      where: {
        couponId: activeCampaign.id,
        claimedBy: userId
      }
    });

    if (existingCode) {
      return NextResponse.json({
        success: true,
        alreadyClaimed: true,
        won: true,
        code: existingCode.code,
        campaignId: activeCampaign.id,
        message: '您已經領取過此活動的專屬序號囉！'
      });
    }

    // 2.5 隨機抽獎邏輯
    const WIN_RATE = 0.3; // 30% 中獎率 (可在此調整)
    const isWinner = Math.random() <= WIN_RATE;

    if (!isWinner) {
      return NextResponse.json({
        success: true,
        won: false,
        alreadyClaimed: false,
        campaignId: activeCampaign.id,
        message: '哎呀，差一點點！下次再來試試手氣吧！'
      });
    }

    // 3. 尋找一張尚未發送，且未被領取的序號
    const availableCode = await prisma.couponCode.findFirst({
      where: {
        couponId: activeCampaign.id,
        isDistributed: false,
        redeemedQuantity: 0,
        claimedBy: null
      }
    });

    if (!availableCode) {
      return NextResponse.json({ 
        success: false, 
        message: '太熱烈了！本次活動的專屬優惠券已經全數發送完畢。' 
      });
    }

    // 4. 把這張序號綁定給該名使用者
    const updatedCode = await prisma.couponCode.update({
      where: { id: availableCode.id },
      data: {
        claimedBy: userId,
        isDistributed: true // 同時標記為已發送，防呆機制同步生效
      }
    });

    return NextResponse.json({
      success: true,
      won: true,
      alreadyClaimed: false,
      code: updatedCode.code,
      campaignId: activeCampaign.id,
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
