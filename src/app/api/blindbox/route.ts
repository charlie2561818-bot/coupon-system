import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const now = new Date();

    // 1. 找出所有 ACTIVE 且在有效期間內的 SINGLE_USE 活動
    const activeCampaigns = await prisma.coupon.findMany({
      where: {
        mode: 'SINGLE_USE',
        status: 'ACTIVE',
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      // 載入每個活動的代碼，以便計算剩餘可用數量
      include: {
        codes: {
          where: {
            isDistributed: false,
          },
          take: 1, // 我們只需要知道有沒有剩餘，並且取一張出來用
        }
      }
    });

    // 2. 過濾出真的還有未派發序號的活動
    const availableCampaigns = activeCampaigns.filter(campaign => campaign.codes.length > 0);

    if (availableCampaigns.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: '目前所有獎項皆已抽完或沒有進行中的活動。 (All prizes have been claimed or no active campaigns.)' 
      });
    }

    // 3. 加入 30% 中獎率判定
    // 3. 加入 30% 中獎率判定
    const WIN_RATE = 0.3;
    if (Math.random() > WIN_RATE) {
      return NextResponse.json({
        success: true,
        won: false,
        message: '哎呀，差一點點！下次再來試試手氣吧！ (Oops, so close! Better luck next time!)'
      });
    }

    // 4. 若中獎，從可用的活動清單中隨機挑選並使用原子性更新防衝突
    let finalCode = null;
    let finalCampaign = null;

    // 最多重試 3 次，避免被並發請求搶走
    for (let i = 0; i < 3; i++) {
      if (availableCampaigns.length === 0) break;

      const randomIndex = Math.floor(Math.random() * availableCampaigns.length);
      const candidateCampaign = availableCampaigns[randomIndex];

      // 即時重新尋找該活動下真正可用的序號
      const freshCode = await prisma.couponCode.findFirst({
        where: {
          couponId: candidateCampaign.id,
          isDistributed: false,
          redeemedQuantity: 0,
          claimedBy: null
        }
      });

      if (!freshCode) {
        // 如果這個活動剛好沒票了，從清單中移除，換抽別的
        availableCampaigns.splice(randomIndex, 1);
        continue;
      }

      // 原子性更新：確保在此毫秒內沒人搶走
      const updateResult = await prisma.couponCode.updateMany({
        where: { 
          id: freshCode.id, 
          isDistributed: false 
        },
        data: { isDistributed: true },
      });

      if (updateResult.count > 0) {
        // 成功搶到這張序號
        finalCode = freshCode;
        finalCampaign = candidateCampaign;
        break;
      }
      // 若 count === 0，代表剛剛好被搶走，進入下一圈重試
    }

    if (!finalCode || !finalCampaign) {
      return NextResponse.json({ 
        success: false, 
        message: '太熱烈了！目前的獎項剛好被抽完，請稍後再試。 (The system is busy, please try again later.)' 
      });
    }

    // 6. 回傳抽中資訊
    return NextResponse.json({
      success: true,
      won: true,
      couponTitle: finalCampaign.title,
      couponEnglishTitle: finalCampaign.englishTitle,
      code: finalCode.code,
      campaignId: finalCampaign.id,
      message: finalCampaign.usageRules || '恭喜中獎！請向櫃檯人員出示此畫面。'
    });

  } catch (error) {
    console.error('Blindbox API Error:', error);
    return NextResponse.json({ success: false, message: '伺服器發生錯誤，請稍後再試。 (Server error, please try again.)' }, { status: 500 });
  }
}
