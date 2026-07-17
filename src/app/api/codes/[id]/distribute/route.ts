import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const code = await prisma.couponCode.update({
      where: { id },
      data: { isDistributed: true },
    });

    return NextResponse.json(code);
  } catch (error) {
    console.error('Failed to distribute coupon code:', error);
    return NextResponse.json(
      { error: 'Failed to update coupon code status' },
      { status: 500 }
    );
  }
}
