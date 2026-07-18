import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // 確認 Coupon 是否存在
    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });
    }

    if (coupon.mode === 'SINGLE_USE') {
      // 找出一張未發送且未被核銷的序號
      const availableCode = await prisma.couponCode.findFirst({
        where: {
          couponId: id,
          isDistributed: false,
          redeemedQuantity: 0
        }
      });

      if (!availableCode) {
        return NextResponse.json({ error: "No available codes to distribute" }, { status: 400 });
      }

      // 標記為已發送 (手動派發不綁定 LINE userId)
      const updatedCode = await prisma.couponCode.update({
        where: { id: availableCode.id },
        data: {
          isDistributed: true,
          claimedBy: "MANUAL_DIRECT_SEND"
        }
      });

      return NextResponse.json({ success: true, code: updatedCode.code }, { status: 200 });
    } else {
      // MULTI_USE 模式：直接回傳該唯一序號，不需要標記為已發送
      const multiCode = await prisma.couponCode.findFirst({
        where: { couponId: id }
      });
      
      if (!multiCode || multiCode.redeemedQuantity >= multiCode.maxUsage) {
        return NextResponse.json({ error: "Code exhausted or not found" }, { status: 400 });
      }

      return NextResponse.json({ success: true, code: multiCode.code }, { status: 200 });
    }
  } catch (error) {
    console.error("Failed to direct send coupon:", error);
    return NextResponse.json({ error: "Failed to direct send coupon" }, { status: 500 });
  }
}
