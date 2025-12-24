import { PrismaClient, CategoryType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const categories = [
        { name: "Lương", type: CategoryType.INCOME },
        { name: "Thưởng", type: CategoryType.INCOME },
        { name: "Đầu tư", type: CategoryType.INCOME },
        { name: "Thu nhập khác", type: CategoryType.INCOME },
        { name: "Ăn uống", type: CategoryType.EXPENSE },
        { name: "Di chuyển", type: CategoryType.EXPENSE },
        { name: "Giải trí", type: CategoryType.EXPENSE },
        { name: "Sức khỏe", type: CategoryType.EXPENSE },
        { name: "Mua sắm", type: CategoryType.EXPENSE },
        { name: "Hóa đơn & Tiện ích", type: CategoryType.EXPENSE },
        { name: "Giáo dục", type: CategoryType.EXPENSE },
        { name: "Du lịch", type: CategoryType.EXPENSE },
        { name: "Nhà ở", type: CategoryType.EXPENSE },
        { name: "Chi phí khác", type: CategoryType.EXPENSE },
    ];

    for (const cat of categories) {
        const existing = await prisma.category.findFirst({ where: { name: cat.name } });
        if (!existing) {
            await prisma.category.create({ data: cat });
        }
    }

    console.log("Seed categories created/updated successfully.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
