import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import EditCouponClient from './EditCouponClient';

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const coupon = await prisma.coupon.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!coupon) {
    notFound();
  }

  // Next.js passes dates as objects to Client Components from Server Components if we just pass them directly.
  // But to avoid serialization issues, we can convert dates to ISO strings before passing.
  const serializedCoupon = {
    ...coupon,
    validFrom: coupon.validFrom.toISOString(),
    validUntil: coupon.validUntil.toISOString(),
  };

  return <EditCouponClient coupon={serializedCoupon} />;
}
