import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 共同的 CORS 標頭
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yuanfateaorder.netlify.app',
  'Access-Control-Allow-Methods': 'GET, OPTIONS, PATCH, DELETE, POST, PUT',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  'Access-Control-Allow-Credentials': 'true',
};

// 處理瀏覽器的 OPTIONS 預檢請求
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, totalAmount } = body;

    // 基本驗證
    if (!code) {
      return NextResponse.json(
        { success: false, message: '請提供優惠碼' },
        { headers: corsHeaders }
      );
    }
    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      return NextResponse.json(
        { success: false, message: '訂單總金額無效' },
        { headers: corsHeaders }
      );
    }

    // 1. 尋找優惠券代碼
    const couponCode = await prisma.couponCode.findUnique({
      where: { code },
      include: { coupon: true }
    });

    if (!couponCode) {
      return NextResponse.json(
        { success: false, message: '此優惠碼不存在' },
        { headers: corsHeaders }
      );
    }

    const { coupon } = couponCode;
    const now = new Date();

    // 2. 檢查活動狀態與時間
    if (coupon.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: '此優惠碼所屬活動已暫停或取消' },
        { headers: corsHeaders }
      );
    }
    if (now < coupon.validFrom) {
      return NextResponse.json(
        { success: false, message: '此優惠碼活動尚未開始' },
        { headers: corsHeaders }
      );
    }
    if (now > coupon.validUntil) {
      return NextResponse.json(
        { success: false, message: '此優惠碼已過期' },
        { headers: corsHeaders }
      );
    }

    // 3. 檢查剩餘次數
    if (couponCode.redeemedQuantity >= couponCode.maxUsage) {
      return NextResponse.json(
        { success: false, message: '此優惠碼已被使用完畢' },
        { headers: corsHeaders }
      );
    }

    // 4. 計算實際折扣金額
    let discountAmount = 0;
    
    if (coupon.discountType === 'FIXED_AMOUNT') {
      // 滿額或直接扣固定金額
      discountAmount = coupon.discountValue;
      // 避免折抵金額超過總金額
      if (discountAmount > totalAmount) {
        discountAmount = totalAmount;
      }
    } else if (coupon.discountType === 'PERCENTAGE') {
      // 打折 (例如：90 代表 9 折，也就是扣除 10%)
      // 公式: 總金額 * (100 - 折扣數) / 100
      const discountPercentage = 100 - coupon.discountValue;
      discountAmount = Math.round(totalAmount * (discountPercentage / 100));
    } else if (coupon.discountType === 'FREE_GIFT') {
      // 滿額贈，金額通常不扣除，但可以回傳 0 與優惠類型
      discountAmount = 0;
    }

    // 5. 回傳驗證成功與折扣金額
    return NextResponse.json(
      { 
        success: true, 
        discount: discountAmount,
      },
      { headers: corsHeaders }
    );
    
  } catch (error) {
    console.error('Validation API error:', error);
    return NextResponse.json(
      { success: false, message: '伺服器發生錯誤，請稍後再試' },
      { headers: corsHeaders }
    );
  }
}
