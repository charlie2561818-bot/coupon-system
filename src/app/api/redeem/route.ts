import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "請輸入優惠券序號" }, { status: 400 });
    }

    // 1. Fetch CouponCode
    const couponCode = await prisma.couponCode.findUnique({
      where: { code },
      include: { coupon: true }
    });

    if (!couponCode) {
      return NextResponse.json({ error: "找不到此優惠券，請確認序號是否正確" }, { status: 404 });
    }

    const { coupon } = couponCode;

    // 2. Validate Coupon Status
    if (coupon.status !== 'ACTIVE') {
      const statusMap: Record<string, string> = { INACTIVE: "未啟用", EXPIRED: "已過期", DEPLETED: "已兌換完畢" };
      return NextResponse.json({ error: `無法核銷，此優惠券狀態為：${statusMap[coupon.status] || coupon.status}` }, { status: 400 });
    }

    // 3. Validate Date
    const now = new Date();
    if (now < coupon.validFrom) {
      return NextResponse.json({ error: "無法核銷，此優惠券尚未開放使用" }, { status: 400 });
    }
    if (now > coupon.validUntil) {
      return NextResponse.json({ error: "無法核銷，此優惠券已過期" }, { status: 400 });
    }

    // 4. Validate Quantity based on mode
    if (coupon.mode === "MULTI_USE") {
      if (couponCode.redeemedQuantity >= couponCode.maxUsage) {
        return NextResponse.json({ error: "此活動兌換名額已滿" }, { status: 400 });
      }
    } else {
      // SINGLE_USE or other
      if (couponCode.redeemedQuantity >= couponCode.maxUsage) {
        return NextResponse.json({ error: "無法核銷，此優惠券序號已被全數兌換完畢" }, { status: 400 });
      }
    }

    // 5. Atomic Transaction: Create Redemption and Update Quantity
    const staffId = (session.user as any).id;

    const result = await prisma.$transaction(async (tx) => {
      // Re-verify quantity inside transaction to prevent race conditions
      const currentCode = await tx.couponCode.findUnique({ where: { id: couponCode.id } });
      if (!currentCode || currentCode.redeemedQuantity >= currentCode.maxUsage) {
        throw new Error("QUOTA_FULL");
      }

      // Create redemption record
      const redemption = await tx.redemption.create({
        data: {
          couponCodeId: couponCode.id,
          staffId: staffId,
        }
      });

      // Update couponCode quantity
      await tx.couponCode.update({
        where: { id: couponCode.id },
        data: { redeemedQuantity: { increment: 1 } }
      });

      // Update parent coupon quantity
      const updatedCoupon = await tx.coupon.update({
        where: { id: coupon.id },
        data: { redeemedQuantity: { increment: 1 } }
      });

      return { redemption, updatedCoupon };
    });

    return NextResponse.json({ 
      success: true, 
      message: "Redemption successful", 
      coupon: result.updatedCoupon 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Redemption error:", error);
    if (error.message === "QUOTA_FULL") {
      return NextResponse.json({ error: "核銷失敗，名額剛好被兌換完畢" }, { status: 400 });
    }
    return NextResponse.json({ error: "核銷處理失敗，請稍後再試" }, { status: 500 });
  }
}
