import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 共同的 CORS 標頭
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yuanfateaorder.netlify.app',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  'Access-Control-Allow-Credentials': 'true',
};

// 處理瀏覽器的 OPTIONS 預檢請求
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const now = new Date();

    // 抓取 B 模式 (MULTI_USE) 且目前有效的優惠券
    const activeCoupons = await prisma.coupon.findMany({
      where: {
        mode: 'MULTI_USE',
        status: 'ACTIVE',
        showInCart: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      include: {
        codes: true,
      },
    });

    // 整理成前端需要的格式
    const data = [];

    for (const coupon of activeCoupons) {
      // 找出該優惠券底下，尚未被核銷完畢的序號
      const availableCode = coupon.codes.find(
        (c) => c.redeemedQuantity < c.maxUsage
      );

      // 如果有可用的序號，才加入清單
      if (availableCode) {
        data.push({
          code: availableCode.code,
          name: coupon.title,
          // 如果是 PERCENTAGE，為了方便前端顯示，可以回傳原始的 100-based 值或 10-based 值
          // 但前端開發者要求的形式是 discount: 100 這種純數字，可能指的是固定金額。
          // 我們先如實回傳 discountValue，前端可以自行利用
          discount: coupon.discountValue,
          // 加上 type 讓前端可以判斷是固定金額還是打折
          type: coupon.discountType, 
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('List API error:', error);
    return NextResponse.json(
      { success: false, message: '伺服器發生錯誤，請稍後再試' },
      { status: 500, headers: corsHeaders }
    );
  }
}
