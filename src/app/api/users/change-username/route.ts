import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.name) { // using session validity check
      return NextResponse.json({ success: false, message: '未授權' }, { status: 401 });
    }

    const { newUsername } = await request.json();
    const currentUsername = (session.user as any).username;

    if (!currentUsername || !newUsername) {
      return NextResponse.json({ success: false, message: '缺少必要參數' }, { status: 400 });
    }

    // Check if new username is already taken
    const existing = await prisma.user.findUnique({ where: { username: newUsername } });
    if (existing && existing.username !== currentUsername) {
      return NextResponse.json({ success: false, message: '這個帳號名稱已經被使用了' }, { status: 400 });
    }

    await prisma.user.update({
      where: { username: currentUsername },
      data: { username: newUsername }
    });

    return NextResponse.json({ success: true, message: '帳號名稱修改成功！下次請使用新帳號登入。' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: '伺服器發生錯誤' }, { status: 500 });
  }
}
