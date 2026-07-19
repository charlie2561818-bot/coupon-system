import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ coupon }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch coupon:", error);
    return NextResponse.json({ error: "Failed to fetch coupon" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // First check if coupon exists
    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Delete the coupon, cascade will handle the rest if enabled, but let's be safe
    const codes = await prisma.couponCode.findMany({ where: { couponId: id } });
    const codeIds = codes.map(c => c.id);
    if (codeIds.length > 0) {
      await prisma.redemption.deleteMany({
        where: { couponCodeId: { in: codeIds } }
      });
      await prisma.couponCode.deleteMany({
        where: { couponId: id }
      });
    }

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete coupon:", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const body = await request.json();
    const { title, englishTitle, usageRules, totalQuantity, validFrom, validUntil, applicableBrand, discountType, discountValue, showInCart, isDraw } = body;

    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
      include: { codes: true }
    });

    if (!existingCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Update parent
    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: {
        title,
        englishTitle,
        usageRules,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        applicableBrand,
        discountType,
        discountValue,
        showInCart: showInCart !== undefined ? Boolean(showInCart) : true,
        isDraw: isDraw !== undefined ? Boolean(isDraw) : true,
        // Only update totalQuantity for MULTI_USE
        ...(existingCoupon.mode === 'MULTI_USE' ? { totalQuantity } : {})
      },
    });

    // If MULTI_USE, also update maxUsage on the single code
    if (existingCoupon.mode === 'MULTI_USE' && existingCoupon.codes.length > 0) {
      await prisma.couponCode.update({
        where: { id: existingCoupon.codes[0].id },
        data: { maxUsage: totalQuantity }
      });
    }

    return NextResponse.json({ coupon: updatedCoupon }, { status: 200 });
  } catch (error) {
    console.error("Failed to update coupon:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}
