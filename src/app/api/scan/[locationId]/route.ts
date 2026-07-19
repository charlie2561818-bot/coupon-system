import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: 取得立牌位置資訊與綁定狀態
export async function GET(request: NextRequest, { params }: { params: Promise<{ locationId: string }> }) {
  try {
    const { locationId } = await params;

    const location = await prisma.qrLocation.findUnique({
      where: { id: locationId }
    });

    if (!location) {
      return NextResponse.json({ success: false, status: 'NOT_FOUND', message: '找不到此立牌位置。 (Location not found.)' });
    }

    // 無綁定活動
    if (!location.activeCampaignId) {
      return NextResponse.json({ 
        success: true, 
        status: 'EMPTY', 
        locationName: location.name,
        message: '本次活動已結束，敬請期待下一波專屬驚喜！ (This event has ended. Stay tuned for the next exclusive surprise!)' 
      });
    }

    // 盲盒模式
    if (location.activeCampaignId === 'BLINDBOX') {
      // 檢查是否有任何可用盲盒庫存
      const now = new Date();
      const activeCampaigns = await prisma.coupon.findMany({
        where: {
          mode: 'SINGLE_USE',
          status: 'ACTIVE',
          validFrom: { lte: now },
          validUntil: { gte: now },
        },
        include: {
          codes: {
            where: { isDistributed: false },
            take: 1,
          }
        }
      });

      const availableCampaigns = activeCampaigns.filter(c => c.codes.length > 0);

      if (availableCampaigns.length === 0) {
        return NextResponse.json({ 
          success: true, 
          status: 'EMPTY', 
          locationName: location.name,
          message: '目前所有獎項皆已抽完，敬請期待下一波專屬驚喜！ (All prizes have been claimed. Stay tuned!)' 
        });
      }

      return NextResponse.json({ 
        success: true, 
        status: 'BLINDBOX', 
        locationName: location.name,
        campaignId: 'BLINDBOX',
        showInCart: true,
        isDraw: true
      });
    }

    // 綁定特定活動
    const campaign = await prisma.coupon.findUnique({
      where: { id: location.activeCampaignId }
    });

    if (!campaign || campaign.status !== 'ACTIVE') {
      return NextResponse.json({ 
        success: true, 
        status: 'EMPTY', 
        locationName: location.name,
        message: '本次活動已結束，敬請期待下一波專屬驚喜！ (This event has ended. Stay tuned!)' 
      });
    }

    const now = new Date();
    if (now < campaign.validFrom || now > campaign.validUntil) {
      return NextResponse.json({ 
        success: true, 
        status: 'EMPTY', 
        locationName: location.name,
        message: '非活動期間。 (This campaign is currently inactive.)' 
      });
    }

    let isAvailable = false;
    if (campaign.mode === 'SINGLE_USE') {
      const availableCode = await prisma.couponCode.findFirst({
        where: { couponId: campaign.id, isDistributed: false }
      });
      isAvailable = !!availableCode;
    } else {
      const multiCode = await prisma.couponCode.findFirst({
        where: { couponId: campaign.id }
      });
      isAvailable = multiCode ? (multiCode.redeemedQuantity < multiCode.maxUsage) : false;
    }

    if (!isAvailable) {
      return NextResponse.json({ 
        success: true, 
        status: 'EMPTY', 
        locationName: location.name,
        message: '太熱烈了！本次活動的優惠券已全數發送完畢。 (All coupons have been claimed!)' 
      });
    }

    return NextResponse.json({ 
      success: true, 
      status: 'SINGLE_ITEM', 
      locationName: location.name,
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      campaignEnglishTitle: campaign.englishTitle,
      showInCart: campaign.showInCart,
      isDraw: campaign.isDraw
    });

  } catch (error) {
    console.error('Scan GET Error:', error);
    return NextResponse.json({ success: false, message: '伺服器發生錯誤。 (Server error.)' }, { status: 500 });
  }
}

// POST: 執行抽獎（結合 API 回傳抽獎結果 + 優惠券）
export async function POST(request: NextRequest, { params }: { params: Promise<{ locationId: string }> }) {
  try {
    const { locationId } = await params;

    const location = await prisma.qrLocation.findUnique({
      where: { id: locationId }
    });

    if (!location || !location.activeCampaignId) {
      return NextResponse.json({ success: false, won: false, message: '此立牌目前未綁定活動。' });
    }

    // TODO: Future LINE ID / Member Token validation
    // const body = await request.json().catch(() => ({}));
    // if (body.userId) { ... check existing claims ... }

    const now = new Date();
    const WIN_RATE = 0.3; // 30% 中獎率

    // ===== 盲盒模式 =====
    if (location.activeCampaignId === 'BLINDBOX') {
      const activeCampaigns = await prisma.coupon.findMany({
        where: {
          mode: 'SINGLE_USE',
          status: 'ACTIVE',
          validFrom: { lte: now },
          validUntil: { gte: now },
        },
        include: {
          codes: {
            where: { isDistributed: false },
            take: 1,
          }
        }
      });

      const availableCampaigns = activeCampaigns.filter(c => c.codes.length > 0);

      if (availableCampaigns.length === 0) {
        return NextResponse.json({ success: false, won: false, message: '目前所有獎項皆已抽完。' });
      }

      // 30% 中獎率判定
      if (Math.random() > WIN_RATE) {
        return NextResponse.json({
          success: true,
          won: false,
          campaignId: 'BLINDBOX',
          isDraw: true,
          message: '哎呀，差一點點！下次再來試試手氣吧！ (Oops, so close! Better luck next time!)'
        });
      }

      // 中獎了！進入原子性更新迴圈（最多重試 3 次）
      let updatedCode = null;
      let finalSelectedCampaign = null;

      for (let i = 0; i < 3; i++) {
        // 為了避免拿到已經過時的 candidate，每次迴圈重新檢查可用的活動
        const currentActiveCampaigns = await prisma.coupon.findMany({
          where: {
            mode: 'SINGLE_USE',
            status: 'ACTIVE',
            validFrom: { lte: now },
            validUntil: { gte: now },
          },
          include: {
            codes: {
              where: { isDistributed: false },
              take: 1,
            }
          }
        });
        const currentAvailableCampaigns = currentActiveCampaigns.filter(c => c.codes.length > 0);
        
        if (currentAvailableCampaigns.length === 0) {
          break; // 真的抽完了
        }

        const randomIndex = Math.floor(Math.random() * currentAvailableCampaigns.length);
        const selectedCampaign = currentAvailableCampaigns[randomIndex];
        const selectedCode = selectedCampaign.codes[0];

        // 原子性更新
        const updateResult = await prisma.couponCode.updateMany({
          where: { 
            id: selectedCode.id,
            isDistributed: false
          },
          data: { isDistributed: true },
        });

        if (updateResult.count > 0) {
          updatedCode = selectedCode;
          finalSelectedCampaign = selectedCampaign;
          break;
        }
      }

      if (!updatedCode || !finalSelectedCampaign) {
         // 檢查是否真的沒獎了
         const stillAvailableCount = await prisma.couponCode.count({
           where: {
             isDistributed: false,
             coupon: {
               mode: 'SINGLE_USE',
               status: 'ACTIVE',
               validFrom: { lte: now },
               validUntil: { gte: now },
             }
           }
         });
         
         if (stillAvailableCount === 0) {
           return NextResponse.json({ success: false, won: false, message: '目前所有獎項皆已抽完。' });
         } else {
           return NextResponse.json({ success: false, won: false, message: '目前領取人數過多，請稍後再試。' });
         }
      }

      return NextResponse.json({
        success: true,
        won: true,
        couponTitle: finalSelectedCampaign.title,
        couponEnglishTitle: finalSelectedCampaign.englishTitle,
        code: updatedCode.code,
        campaignId: finalSelectedCampaign.id,
        showInCart: finalSelectedCampaign.showInCart,
        isDraw: true,
        message: finalSelectedCampaign.usageRules || '恭喜中獎！請向櫃檯人員出示此畫面。'
      });
    }

    // ===== 單品模式 =====
    const campaign = await prisma.coupon.findUnique({
      where: { id: location.activeCampaignId }
    });

    if (!campaign || campaign.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, won: false, message: '此活動不存在或已結束。' });
    }

    let selectedCode: any = null;
    if (campaign.mode === 'SINGLE_USE') {
      // 原子性更新迴圈
      for (let i = 0; i < 3; i++) {
        const candidateCode = await prisma.couponCode.findFirst({
          where: {
            couponId: campaign.id,
            isDistributed: false,
            redeemedQuantity: 0,
            claimedBy: null
          }
        });

        if (!candidateCode) {
          break; // 真的沒有庫存了
        }

        const updateResult = await prisma.couponCode.updateMany({
          where: { 
            id: candidateCode.id,
            isDistributed: false
          },
          data: { isDistributed: true }
        });

        if (updateResult.count > 0) {
          selectedCode = candidateCode;
          break;
        }
      }
      
      if (!selectedCode) {
        const remainingCount = await prisma.couponCode.count({
          where: {
            couponId: campaign.id,
            isDistributed: false,
            redeemedQuantity: 0,
            claimedBy: null
          }
        });
        if (remainingCount === 0) {
          return NextResponse.json({ success: false, won: false, message: '本活動優惠券已全數發送完畢。' });
        } else {
          return NextResponse.json({ success: false, won: false, message: '目前領取人數過多，請稍後再試。' });
        }
      }

    } else {
      selectedCode = await prisma.couponCode.findFirst({
        where: { couponId: campaign.id }
      });
      if (selectedCode && selectedCode.redeemedQuantity >= selectedCode.maxUsage) {
        selectedCode = null; // Mark as unavailable
      }
      
      if (!selectedCode) {
        return NextResponse.json({ success: false, won: false, message: '本活動優惠券已全數發送完畢。' });
      }

      // 對於一碼多用，也將 isDistributed 設為 true 讓後台顯示「已發出」
      await prisma.couponCode.updateMany({
        where: { id: selectedCode.id, isDistributed: false },
        data: { isDistributed: true },
      });
    }

    if (now < campaign.validFrom || now > campaign.validUntil) {
      return NextResponse.json({ success: false, won: false, message: '非活動期間。' });
    }

    // 抽獎或直接領取邏輯
    const ACTUAL_WIN_RATE = campaign.isDraw ? 0.3 : 1.0;
    if (Math.random() > ACTUAL_WIN_RATE) {
      return NextResponse.json({
        success: true,
        won: false,
        campaignId: campaign.id,
        isDraw: campaign.isDraw,
        message: '哎呀，差一點點！下次再來試試手氣吧！ (Oops, so close! Better luck next time!)'
      });
    }

    return NextResponse.json({
      success: true,
      won: true,
      couponTitle: campaign.title,
      couponEnglishTitle: campaign.englishTitle,
      code: selectedCode.code,
      campaignId: campaign.id,
      showInCart: campaign.showInCart,
      isDraw: campaign.isDraw,
      message: campaign.usageRules || '恭喜中獎！請向櫃檯人員出示此畫面。 (Congratulations! Please present this screen to our staff.)'
    });

  } catch (error) {
    console.error('Scan POST Error:', error);
    return NextResponse.json({ success: false, won: false, message: '伺服器發生錯誤。' }, { status: 500 });
  }
}
