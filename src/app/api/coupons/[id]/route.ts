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

    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
      include: { codes: true }
    });

    if (!existingCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Create an update object dynamically based on provided fields
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.englishTitle !== undefined) updateData.englishTitle = body.englishTitle;
    if (body.usageRules !== undefined) updateData.usageRules = body.usageRules;
    if (body.validFrom !== undefined) updateData.validFrom = new Date(body.validFrom);
    if (body.validUntil !== undefined) updateData.validUntil = new Date(body.validUntil);
    if (body.applicableBrand !== undefined) updateData.applicableBrand = body.applicableBrand;
    if (body.discountType !== undefined) updateData.discountType = body.discountType;
    if (body.discountValue !== undefined) updateData.discountValue = body.discountValue;
    if (body.showInCart !== undefined) updateData.showInCart = Boolean(body.showInCart);
    if (body.isDraw !== undefined) updateData.isDraw = Boolean(body.isDraw);
    if (body.status !== undefined) {
      if (body.status === 'ACTIVE') {
        const now = new Date();
        const checkValidUntil = updateData.validUntil || existingCoupon.validUntil;
        if (now > new Date(checkValidUntil)) {
          return NextResponse.json({ error: "無法啟用已過期的活動 (Cannot activate an expired campaign)" }, { status: 400 });
        }
      }
      updateData.status = body.status;
    }
    if (body.totalQuantity !== undefined && existingCoupon.mode === 'MULTI_USE') {
      updateData.totalQuantity = body.totalQuantity;
    }

    // Update parent
    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    // If MULTI_USE, also update maxUsage on the single code if totalQuantity is provided
    if (existingCoupon.mode === 'MULTI_USE' && existingCoupon.codes.length > 0 && body.totalQuantity !== undefined) {
      await prisma.couponCode.update({
        where: { id: existingCoupon.codes[0].id },
        data: { maxUsage: body.totalQuantity }
      });
    }

    return NextResponse.json({ coupon: updatedCoupon }, { status: 200 });
  } catch (error) {
    console.error("Failed to update coupon:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}
