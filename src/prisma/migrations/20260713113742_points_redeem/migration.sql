-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('signup_bonus', 'purchase_earn', 'spin_reward', 'spin_multiplier', 'birthday_bonus', 'redeem');

-- CreateTable
CREATE TABLE "points_levels" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "min_period_points" DECIMAL(10,2) NOT NULL,
    "earn_rate" DECIMAL(10,4) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(100) NOT NULL,
    "updated_by" VARCHAR(100) NOT NULL,

    CONSTRAINT "points_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "evaluation_period_days" INTEGER NOT NULL,
    "signup_bonus_points" DECIMAL(10,2) NOT NULL,
    "birthday_bonus_points" DECIMAL(10,2) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(100) NOT NULL,

    CONSTRAINT "points_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_rewards" (
    "id" UUID NOT NULL,
    "menu_item_id" INTEGER NOT NULL,
    "name" VARCHAR(100),
    "points_required" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "points_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_transactions" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "points" DECIMAL(10,2) NOT NULL,
    "balance_after" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100) NOT NULL,

    CONSTRAINT "points_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_user_state" (
    "user_id" UUID NOT NULL,
    "current_balance" DECIMAL(10,2) NOT NULL,
    "current_level_id" UUID,
    "period_points_earned" DECIMAL(10,2) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "points_user_state_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "points_transactions_user_id_created_at_idx" ON "points_transactions"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_rewards" ADD CONSTRAINT "points_rewards_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_user_state" ADD CONSTRAINT "points_user_state_current_level_id_fkey" FOREIGN KEY ("current_level_id") REFERENCES "points_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
