-- TC-DB-004: Add Foreign Key Constraint to prevent tour deletion when there are bookings
-- This script adds a FK constraint that prevents deleting tours with active bookings

-- Step 1: Drop existing CASCADE FK (created by TypeORM)
ALTER TABLE tour_schedules DROP CONSTRAINT IF EXISTS "FK_6e62537a05e99557980387c9885";

-- Step 2: Add FK from tour_schedules to tours with RESTRICT (prevents tour deletion when schedules exist)
ALTER TABLE tour_schedules 
ADD CONSTRAINT fk_tour_schedules_tour_restrict 
FOREIGN KEY ("tourId") 
REFERENCES tours(id) 
ON DELETE RESTRICT;

-- Step 3: Add FK from bookings to tour_schedules to ensure data integrity
ALTER TABLE bookings 
ADD CONSTRAINT fk_bookings_schedule_restrict
FOREIGN KEY (schedule_id) 
REFERENCES tour_schedules(id) 
ON DELETE RESTRICT;
