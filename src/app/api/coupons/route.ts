import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ coupons });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { mode, code, title, englishTitle, usageRules, totalQuantity, validFrom, validUntil, applicableBrand, discountType, discountValue, showInCart, isDraw } = body;

    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `CPN-${result}`;
    };

    const codesData = [];
    
    if (mode === 'SINGLE_USE') {
      // 產生 N 張，每張 maxUsage = 1
      for (let i = 0; i < totalQuantity; i++) {
        codesData.push({
          code: generateCode(),
          maxUsage: 1,
        });
      }
    } else {
      // B模式 (MULTI_USE)：只產生 1 張，但可以被掃描 totalQuantity 次
      codesData.push({
        code: code || generateCode(),
        maxUsage: totalQuantity,
      });
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        mode,
        title,
        englishTitle,
        usageRules,
        totalQuantity, // For A, it's count of codes. For B, it's max uses.
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        applicableBrand,
        discountType,
        discountValue,
        showInCart: showInCart !== undefined ? Boolean(showInCart) : true,
        isDraw: isDraw !== undefined ? Boolean(isDraw) : true,
        codes: {
          create: codesData,
        }
      },
    });

    return NextResponse.json({ coupon: newCoupon }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
