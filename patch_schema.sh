#!/bin/bash
sed -i '' '/updatedAt        DateTime @updatedAt/a\
  showInCart       Boolean  @default(true) // 是否顯示於線上購物車結帳頁
' prisma/schema.prisma
