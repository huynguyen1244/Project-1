import { PrismaClient, CategoryType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const categories = [
        { name: "Salary", type: CategoryType.INCOME },
        { name: "Bonus", type: CategoryType.INCOME },
        { name: "Food", type: CategoryType.EXPENSE },
        { name: "Transport", type: CategoryType.EXPENSE },
        { name: "Entertainment", type: CategoryType.EXPENSE },
        { name: "Health", type: CategoryType.EXPENSE },
        { name: "Shopping", type: CategoryType.EXPENSE },
        { name: "Utilities", type: CategoryType.EXPENSE },
        { name: "Others", type: CategoryType.EXPENSE },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { name: cat.name },
            update: {},
            create: cat,
        });
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
