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
    // 3. 加入 100% 中獎率判定 (暫時供測試用)
    const WIN_RATE = 1.0;
    if (Math.random() > WIN_RATE) {
      return NextResponse.json({
        success: true,
        won: false,
        message: '哎呀，差一點點！下次再來試試手氣吧！ (Oops, so close! Better luck next time!)'
      });
    }

    // 4. 若中獎，從可用的活動清單中「平均隨機」挑選一個
    // (未來如果需要加入機率權重，可修改此處的挑選邏輯)
    const randomIndex = Math.floor(Math.random() * availableCampaigns.length);
    const selectedCampaign = availableCampaigns[randomIndex];
    const selectedCode = selectedCampaign.codes[0];

    // 5. 使用 Transaction 將該序號標記為已派發
    await prisma.$transaction([
      prisma.couponCode.update({
        where: { id: selectedCode.id },
        data: { isDistributed: true },
      }),
      // 注意：這裡先不增加 redeemedQuantity，那是核銷時才加的。
    ]);

    // 6. 回傳抽中資訊
    return NextResponse.json({
      success: true,
      won: true,
      couponTitle: selectedCampaign.title,
      couponEnglishTitle: selectedCampaign.englishTitle,
      code: selectedCode.code,
      campaignId: selectedCampaign.id,
      message: selectedCampaign.usageRules || '恭喜中獎！請向櫃檯人員出示此畫面。'
    });

  } catch (error) {
    console.error('Blindbox API Error:', error);
    return NextResponse.json({ success: false, message: '伺服器發生錯誤，請稍後再試。 (Server error, please try again.)' }, { status: 500 });
  }
}
