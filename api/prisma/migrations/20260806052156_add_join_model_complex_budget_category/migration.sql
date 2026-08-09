-- CreateTable
CREATE TABLE "ComplexBudgetCategory" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "limit" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplexBudgetCategory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ComplexBudgetCategory" ADD CONSTRAINT "ComplexBudgetCategory_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "ComplexBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplexBudgetCategory" ADD CONSTRAINT "ComplexBudgetCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "ComplexBudgetCategory_budgetId_categoryId_key" ON "ComplexBudgetCategory"("budgetId", "categoryId");
