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
        showInCart: campaign.showInCart,
        isDraw: campaign.isDraw,
        message: '您已經領取過此活動的專屬序號囉！ (You have already claimed a promo code for this campaign!)'
      });
    }

    // 抽獎或直接領取邏輯
    const WIN_RATE = campaign.isDraw ? 0.3 : 1.0; // 若非抽獎模式，中獎率 100%
    const isWinner = Math.random() <= WIN_RATE;

    if (!isWinner) {
      return NextResponse.json({
        success: true,
        won: false,
        alreadyClaimed: false,
        campaignId,
        isDraw: campaign.isDraw,
        message: '哎呀，差一點點！下次再來試試手氣吧！ (Oops, so close! Better luck next time!)'
      });
    }

    // 找出一張尚未發送且未被領取的序號，最多重試 3 次
    let updatedCode = null;
    for (let i = 0; i < 3; i++) {
      const availableCode = await prisma.couponCode.findFirst({
        where: {
          couponId: campaignId,
          isDistributed: false,
          redeemedQuantity: 0,
          claimedBy: null
        }
      });

      if (!availableCode) {
        break; // 真的沒有庫存了
      }

      // 原子性更新：確保在這幾毫秒內沒有被其他人搶走
      const updateResult = await prisma.couponCode.updateMany({
        where: { 
          id: availableCode.id,
          isDistributed: false 
        },
        data: {
          claimedBy: userId,
          isDistributed: true
        }
      });

      if (updateResult.count > 0) {
        // 更新成功，成功搶到這張序號
        updatedCode = availableCode;
        break;
      }
      // 如果 count === 0，代表剛好被搶走，進入下一次迴圈重試
    }

    if (!updatedCode) {
      // 檢查是否真的沒庫存，或是 3 次都剛好跟別人撞
      const remainingCount = await prisma.couponCode.count({
        where: {
          couponId: campaignId,
          isDistributed: false,
          redeemedQuantity: 0,
          claimedBy: null
        }
      });

      if (remainingCount === 0) {
        return NextResponse.json({ 
          success: false, 
          campaignId,
          message: '太熱烈了！本次活動的優惠券已經全數發送完畢。 (All coupons for this campaign have been claimed!)' 
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          campaignId,
          message: '目前領取人數過多，請稍後再試。 (The system is busy, please try again later.)' 
        });
      }
    }

    return NextResponse.json({
      success: true,
      won: true,
      alreadyClaimed: false,
      code: updatedCode.code,
      couponTitle: campaign.title,
      couponEnglishTitle: campaign.englishTitle,
      showInCart: campaign.showInCart,
      isDraw: campaign.isDraw,
      message: campaign.usageRules || (campaign.isDraw 
        ? '恭喜中獎！請向櫃檯人員出示此畫面。 (Congratulations! Please present this screen to our staff.)' 
        : '領取成功！請向櫃檯人員出示此畫面。 (Successfully claimed! Please present this screen to our staff.)')
    });

  } catch (error) {
    console.error('Line claim API error:', error);
    return NextResponse.json(
      { success: false, message: '伺服器發生異常，請稍後再試。' },
      { status: 500 }
    );
  }
}
