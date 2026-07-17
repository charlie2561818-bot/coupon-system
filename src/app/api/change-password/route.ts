import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.name) {
      // name in NextAuth usually holds the username or ID in our setup. Wait, in auth.ts, session.user.username is mapped.
      // Let's use token mapping.
      // We'll just check session.
      return NextResponse.json({ success: false, message: '未授權' }, { status: 401 });
    }

    const { oldPassword, newPassword } = await request.json();
    const username = (session.user as any).username;

    if (!username || !oldPassword || !newPassword) {
      return NextResponse.json({ success: false, message: '缺少必要參數' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ success: false, message: '找不到使用者' }, { status: 404 });
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ success: false, message: '舊密碼錯誤' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { username },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ success: true, message: '密碼修改成功' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '伺服器發生錯誤' }, { status: 500 });
  }
}
